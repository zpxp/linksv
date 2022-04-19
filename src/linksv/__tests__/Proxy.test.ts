import { Link, LinkTransaction, LinkSv, LinkTemplate } from "..";
import { Constants } from "../Constants";
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

@LinkTemplate("symbols")
class SymbolTest extends Link {
	[key: symbol]: any;

	setVal(sym: symbol) {
		this[sym] = true;
	}

	getVal(sym: symbol) {
		return this[sym];
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

	test("Should make outputs with no app name", async () => {
		const { tx, ctx } = prepare({ appName: "" });
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
		expect(Array.isArray(inst.arr2)).toBe(true);
		expect(inst.arr.concat(inst.arr2)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
	});

	test("Should error", async () => {
		const { tx, ctx } = prepare();
		const inst = tx.update(() => new Test());
		expect(() => {
			inst.subObj.count = 5;
		}).toThrow();
	});

	test("Should set symbol", async () => {
		const { tx, ctx } = prepare();
		const inst: any = tx.update(() => new Test());
		const sym = Symbol("t");
		// can set symbol outside method
		inst[sym] = 5;
		expect(inst[sym]).toBe(5);

		// setting state should not override syms
		inst[Constants.SetState] = {};
		expect(inst[sym]).toBe(5);
	});

	test("Should set symbol in link", async () => {
		const { tx, ctx } = prepare();
		const inst = tx.update(() => new SymbolTest());
		const sym1 = Symbol("1");
		const sym2 = Symbol("2");
		// can set symbol outside method
		inst[sym1] = 5;
		expect(inst[sym1]).toBe(5);
		// its not set inside the state tho
		expect(tx.update(() => inst.getVal(sym1))).toBe(undefined);

		tx.update(() => inst.setVal(sym2));
		// syms recorded in the link tho are returned
		expect(tx.update(() => inst.getVal(sym2))).toBe(true);
		expect(inst[sym2]).toBe(true);
	});
});
