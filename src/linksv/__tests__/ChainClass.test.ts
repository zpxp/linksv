import { ChainClass, Link, LinkSv, LinkTemplate, LinkTransaction } from "..";
import { prepare } from "./Prepare.notest";
import { Sword } from "./Sword.notest";

@LinkTemplate("test")
class Test extends Link {
	data: Class2;

	setData(d: Class2) {
		this.data = d;
	}
}

@ChainClass("cclass")
class Class2 {
	name: string;
	hasName() {
		return !!this.name;
	}
}

describe("Chain class", () => {
	test("Should record prototype", async () => {
		const { tx, ctx, ctx2 } = prepare();
		const inst = tx.update(() => new Test());
		const other = new Class2();
		other.name = "gg";
		tx.update(() => inst.setData(other));
		await tx.publish();
		ctx2.activate();
		const inst2 = await ctx2.load(Test, inst.location);
		expect(inst.data).toBeInstanceOf(Class2);
		expect(inst.data.hasName()).toBe(true);
		expect(inst2.data).toBeInstanceOf(Class2);
		expect(inst2.data.hasName()).toBe(true);
	});

	test("Should record prototype during serialize", async () => {
		const { tx, ctx, ctx2 } = prepare();
		const inst = tx.update(() => new Test());
		const other = new Class2();
		other.name = "gg";
		tx.update(() => inst.setData(other));
		await tx.publish();
		const serial = ctx.serialize(inst);
		ctx2.activate();
		const inst2: Test = await ctx2.deserialize(serial);
		expect(inst.data).toBeInstanceOf(Class2);
		expect(inst.data.hasName()).toBe(true);
		expect(inst2.data).toBeInstanceOf(Class2);
		expect(inst2.data.hasName()).toBe(true);
	});
});
