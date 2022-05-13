/* eslint-disable prefer-const */
import { Link, LinkTransaction, LinkTemplate } from "..";
import { prepare } from "./Prepare.notest";

@LinkTemplate("As")
class AA extends Link {
	bs: BB[] = [];
	name: string;

	addB(b: BB[]) {
		this.bs.push(...b);
		return this;
	}

	setName(n: string) {
		this.name = n;
	}
}

@LinkTemplate("Bs")
class BB extends Link {
	cs: CC = null;
	name: string;
	setName(n: string) {
		this.name = n;
	}

	addC(b: CC) {
		this.cs = b;
		return this;
	}
}

@LinkTemplate("Cs")
class CC extends Link {
	constructor(public name: string) {
		super();
	}
	setName(n: string) {
		this.name = n;
	}
}

describe("syncing", () => {
	test("Should sync all sublinks to correct latest state", async () => {
		let { tx, ctx } = prepare();

		//setup some state
		const a = tx.update(() => {
			const a = new AA();
			const b1 = new BB();
			const c1 = new CC("c1");
			b1.setName("b1");
			b1.addC(c1);
			const b2 = new BB();
			b2.setName("b2");
			a.addB([b1, b2]);
			return a;
		});

		await tx.publish();

		const startLoca = a.location;

		tx = new LinkTransaction();
		tx.update(() => {
			const removed = a.bs.splice(0, 1);
			removed[0].destroy();
			removed[0].cs.setName("changed c");
			a.bs[0].setName("b2 changed");
			// a.bs[0].cs.setName("changed c2");
			const b3 = new BB();
			const c2 = new CC("c2");
			b3.setName("b3");
			b3.addC(c2);
			a.addB([b3]);
		});

		await tx.publish();

		expect(a.bs[0].name).toBe("b2 changed");
		expect(a.bs[1].name).toBe("b3");
		expect(a.bs[0].cs).toBeFalsy();
		expect(a.bs[1].cs.name).toBe("c2");

		ctx.purge();

		// now do the test
		const loaded = await ctx.load(AA, startLoca);
		expect(loaded.bs[0].name).toBe("b1");
		expect(loaded.bs[1].name).toBe("b2");
		expect(loaded.bs[0].cs.name).toBe("c1");
		expect(loaded.bs[1].cs).toBeFalsy();

		await loaded.sync(true);

		expect(loaded.bs[0].name).toBe("b2 changed");
		expect(loaded.bs[1].name).toBe("b3");
		expect(loaded.bs[0].cs).toBeFalsy();
		expect(loaded.bs[1].cs.name).toBe("c2");
	});
});
