import { Link, LinkTransaction, LinkTemplate } from "..";
import { prepare } from "./Prepare.notest";

@LinkTemplate("A")
class A extends Link {
	bs: B[] = [];
	name: string;

	addB(b: B[]) {
		this.bs.push(...b);
		return this;
	}
	cs: C;

	addC(c: C) {
		this.cs = c;
		return this;
	}

	setName(n: string) {
		this.name = n;
	}
}

@LinkTemplate("B")
class B extends Link {
	cs: C;

	addC(c: C) {
		this.cs = c;
		return this;
	}

	bs: B[] = [];

	addB(b: B[]) {
		this.bs.push(...b);
		return this;
	}

	name: string;
	setName(n: string) {
		this.name = n;
	}
}

@LinkTemplate("C")
class C extends Link {
	value = 1;
	setInt() {
		this.value++;
		return this;
	}
}

async function referenceHelper(topLevel: boolean) {
	const { tx, ctx } = prepare();
	const c = tx.update(() => new C());
	const b = tx.update(() => new B().addC(c));
	const a = tx.update(() => new A().addB([b]));

	await tx.publish();

	let tx2 = new LinkTransaction();
	tx2.update(() => c.setInt());
	const b2 = tx2.update(() => new B().addC(c));
	tx2.update(() => a.addB([b2]));
	await tx2.publish();

	tx2 = new LinkTransaction();
	tx2.update(() => c.setInt());
	const b3 = tx2.update(() => new B().addC(c));
	tx2.update(() => a.addB([b3]));
	await tx2.publish();

	tx2 = new LinkTransaction();
	tx2.update(() => c.setInt());
	const b4 = tx2.update(() => new B().addB([b, b2, b3]).addC(c));
	if (topLevel) {
		tx2.update(() => a.addC(c).addB([b4]));
	} else {
		tx2.update(() => a.addB([b4]));
	}
	const txid = await tx2.publish();
	return { location: a.location, txid, api: ctx.api, ctx };
}

async function referenceHelper2(topLevel: boolean) {
	const { tx, ctx } = prepare();
	const c = tx.update(() => new C());
	const b = tx.update(() => new B().addC(c));
	const a = tx.update(() => new A().addB([b]));

	await tx.publish();

	let tx2 = new LinkTransaction();
	tx2.update(() => c.setInt());
	await tx2.publish();

	tx2 = new LinkTransaction();
	tx2.update(() => c.setInt());
	await tx2.publish();

	return { location: a.location, api: ctx.api, provider: ctx.provider };
}

describe("link", () => {
	test("Should have same references", async () => {
		const { txid, api, location } = await referenceHelper(true);
		const { tx, ctx } = prepare({ api });
		const a = await ctx.load(A, location);
		expect(a).toBeInstanceOf(A);
		expect(a.bs.length).toBe(4);
		expect(a.bs.every(x => x.cs === a.cs)).toBeTruthy();
		expect(a.bs.every(x => x.cs.location === a.cs.location)).toBeTruthy();
		expect(a.bs.every(x => x.cs === a.cs)).toBeTruthy();
	});

	test("Should have same references2", async () => {
		const { txid, api, location } = await referenceHelper(false);
		const { tx, ctx } = prepare({ api });
		const a = await ctx.load(A, location);
		expect(a).toBeInstanceOf(A);
		expect(a.bs.length).toBe(4);
		expect(a.bs.every(x => x.cs.nonce === 4)).toBeTruthy();
		expect(a.bs.every(x => x instanceof B)).toBeTruthy();
		expect(a.bs.every(x => x.cs instanceof C)).toBeTruthy();
		expect(a.bs.every(x => x.cs.location === a.bs[0].cs.location)).toBeTruthy();
		expect(a.bs.every(x => x.cs === a.bs[0].cs)).toBeTruthy();
		expect(a.bs.every(x => x.bs.every(b => x.cs === b.cs))).toBeTruthy();
	});

	test("Should have latest nonce", async () => {
		const { api, location, provider } = await referenceHelper2(false);
		const { tx, ctx } = prepare({ api, provider });
		const a = await ctx.load(A, location);
		expect(a).toBeInstanceOf(A);
		expect(a.bs.length).toBe(1);
		expect(a.bs.every(x => x.cs.nonce === 1)).toBeTruthy();
		expect(a.bs.every(x => x instanceof B)).toBeTruthy();
		expect(a.bs.every(x => x.cs instanceof C)).toBeTruthy();

		await a.sync(true);
		expect(a.bs.every(x => x.cs.nonce === 3)).toBeTruthy();
		expect(a.bs.every(x => x instanceof B)).toBeTruthy();
		expect(a.bs.every(x => x.cs instanceof C)).toBeTruthy();
	});

	test("Should export and import", async () => {
		const { txid, api, location } = await referenceHelper(false);
		const { ctx } = prepare({ api });
		const aa = await ctx.load(A, location);
		expect(aa).toBeInstanceOf(A);
		let tx = new LinkTransaction();
		tx.update(() => aa.setName("name a"));
		tx.update(() => aa.bs[0].setName("name b"));

		const str = tx.export();
		tx.rollback();

		tx = await ctx.import(str);
		expect(tx.outputs.length).toBe(2);
		const iaa = tx.outputs[0] as A;
		const ibb = tx.outputs[1] as B;
		expect(iaa).toBeInstanceOf(A);
		expect(ibb).toBeInstanceOf(B);
		expect(iaa).toEqual(aa);
		expect(iaa.bs[0]).toBe(aa.bs[0]);
		expect(iaa.name).toBe("name a");
		expect(iaa.bs[0].name).toBe("name b");
	});
});
