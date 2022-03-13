import { Link, LinkTransaction, LinkSv, LinkTemplate } from "..";
import { prepare } from "./Prepare.notest";

@LinkTemplate("tt")
class Test extends Link {
	subObj: { count: number } = {
		count: 0
	};

	arr: any[] = [];
	arr2: any[] = [];

	setCount(a: number) {
		this.subObj.count = a;
	}

	setArrs(a1: any[], a2: any[]) {
		this.arr = a1;
		this.arr2 = a2;
	}
}

describe("Proxy", () => {
	test("Should be proxy", async () => {
		const { tx, ctx } = prepare();
		const inst = tx.update(() => new Test());
		expect(inst[LinkSv.IsProxy]).toBe(true);
	});

	test("Should be proxy property", async () => {
		const { tx, ctx } = prepare();
		const inst = tx.update(() => new Test());
		expect((inst.subObj as any)[LinkSv.IsProxy]).toBe(true);
		expect((inst.setCount as any)[LinkSv.IsProxy]).toBe(true);
		expect((inst.arr.map as any)[LinkSv.IsProxy]).toBeFalsy();
	});

	test("Should make outputs", async () => {
		const { tx, ctx } = prepare();
		const inst = tx.update(() => new Test());
		await tx.publish();
		const tx2 = new LinkTransaction();
		tx2.update(() => inst.setCount(2));
		expect(tx2.outputs.length).toBe(1);
	});

	test("Should not make outputs", async () => {
		const { tx, ctx } = prepare();
		const inst = tx.update(() => new Test());
		await tx.publish();
		const tx2 = new LinkTransaction();
		tx2.update(() => inst.arr.map(x => x));
		expect(tx2.outputs.length).toBe(0);
	});

	test("Should work array symbols", async () => {
		const { tx, ctx } = prepare();
		const inst = tx.update(() => new Test());
		tx.update(() => inst.setArrs([1, 2, 3, 4], [5, 6, 7, 8]));
		expect(Array.isArray(inst.arr2)).toBe(true)
		expect(inst.arr.concat(inst.arr2)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
	});

	test("Should error", async () => {
		const { tx, ctx } = prepare();
		const inst = tx.update(() => new Test());
		expect(() => {
			inst.subObj.count = 5;
		}).toThrow();
	});
});
