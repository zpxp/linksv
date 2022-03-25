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

describe("TemplateOwner", () => {
	test("Should deploy", async () => {
		const { tx, ctx, ctx2 } = prepare();
		tx.deploy(Test, ctx2.owner.addressStr);
		await tx.publish();
		expect(Test.owner).toEqual(ctx2.owner.addressStr);
		expect(Test.location).toEqual("0000000000000000000000000000000000000000000000000000000000000001_1");

		const tx2 = new LinkTransaction();
		const inst = tx2.update(() => new Test());
		await tx2.pay();
		tx2.sign();
		// will require template owners sig
		expect(tx2.isFullySigned()).toBe(false);
		ctx2.activate();
		tx2.sign();
		await tx2.publish({ pay: false });

		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000002_2");

		ctx.activate();
		const tx3 = new LinkTransaction();
		tx3.update(() => inst.setCount(1));
		await tx3.pay();
		tx3.sign();
		// we should no longer require template owner to modify instance we own
		expect(tx3.isFullySigned()).toBe(true);
	});
});
