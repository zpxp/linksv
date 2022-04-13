import { Link, LinkTransaction, LinkSv, LinkTemplate } from "..";
import { MockApi } from "../apis/MockApi";
import { LINK_DUST } from "../Link";
import { prepare } from "./Prepare.notest";
import { Sword } from "./Sword.notest";

let i = 0;
function makeClass(owner?: string) {
	@LinkTemplate("tt" + i++)
	class Test extends Link {
		subObj: { count: number } = {
			count: 0
		};

		arr: any[] = [];
		arr2: any[] = [];
		static owner: string = owner;
		// we also have to manually set this if not deploying
		static satoshis: number = owner ? LINK_DUST - 1 : undefined;

		setCount(a: number) {
			this.subObj.count = a;
		}

		setArrs(a1: any[], a2: any[]) {
			this.arr = a1;
			this.arr2 = a2;
		}
	}
	return Test;
}

describe("TemplateOwner", () => {
	test("Should deploy", async () => {
		const { tx, ctx, ctx2 } = prepare();
		const Test = makeClass();
		tx.deploy(Test, ctx2.owner.addressStr);
		await tx.publish();
		expect(Test.owner).toEqual(ctx2.owner.addressStr);
		expect(Test.location).toEqual("0000000000000000000000000000000000000000000000000000000000000001_1");
		expect(Test.satoshis).toEqual(ctx2.templateSatoshiValue);

		if (ctx.api instanceof MockApi) {
			// mock utxo
			ctx.api.unspentUtxos[ctx2.owner.addressStr] = [
				{ tx_pos: 2, tx_hash: "8888000000000000000000000000000000000000000000000000000000002220", value: ctx.templateSatoshiValue }
			];
		}

		const tx2 = new LinkTransaction();
		const inst = tx2.update(() => new Test());
		await tx2.pay();
		tx2.sign();
		// will require template owners sig
		expect(tx2.isFullySigned()).toBe(false);
		ctx2.activate();
		tx2.sign();
		await tx2.publish({ pay: false });

		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000002_1");

		ctx.activate();
		const tx3 = new LinkTransaction();
		tx3.update(() => inst.setCount(1));
		await tx3.pay();
		tx3.sign();
		// we should no longer require template owner to modify instance we own
		expect(tx3.isFullySigned()).toBe(true);
	});

	test("Should not spend link utxo", async () => {
		const { tx, ctx, ctx2 } = prepare();
		const Test = makeClass();
		ctx.activate();
		tx.update(() => new Sword("sword"));
		await tx.publish();

		const tx2 = new LinkTransaction();
		tx2.deploy(Test, ctx2.owner.addressStr);
		await tx2.publish();
		expect(Test.owner).toEqual(ctx2.owner.addressStr);
		expect(Test.location).toEqual("0000000000000000000000000000000000000000000000000000000000000002_1");
		expect(Test.satoshis).toEqual(ctx2.templateSatoshiValue);

		const tx3 = new LinkTransaction();
		const inst = tx3.update(() => new Test());
		await tx3.pay();
		tx3.sign();
		// will require template owners sig
		expect(tx3.isFullySigned()).toBe(false);
		ctx2.activate();
		tx3.sign();
		await tx3.publish({ pay: false });

		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000003_1");

		ctx.activate();
		const tx4 = new LinkTransaction();
		tx4.update(() => inst.setCount(1));
		await tx4.pay();
		tx4.sign();
		// we should no longer require template owner to modify instance we own
		expect(tx4.isFullySigned()).toBe(true);
	});

	test("Should require owner sig if has owner but not deployed", async () => {
		const { tx, ctx, ctx2 } = prepare();
		const Test = makeClass(ctx2.owner.addressStr);
		expect(Test.owner).toBe(ctx2.owner.addressStr);

		if (ctx.api instanceof MockApi) {
			// mock utxo
			ctx.api.unspentUtxos[ctx2.owner.addressStr] = [
				{ tx_pos: 2, tx_hash: "8888000000000000000000000000000000000000000000000000000000002220", value: ctx.templateSatoshiValue }
			];
		}

		const tx2 = new LinkTransaction();
		const inst = tx2.update(() => new Test());
		await tx2.pay();
		tx2.sign();
		// will require template owners sig
		expect(tx2.isFullySigned()).toBe(false);
		ctx2.activate();
		tx2.sign();
		await tx2.publish({ pay: false });

		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");

		ctx.activate();
		const tx3 = new LinkTransaction();
		tx3.update(() => inst.setCount(1));
		await tx3.pay();
		tx3.sign();
		// we should no longer require template owner to modify instance we own
		expect(tx3.isFullySigned()).toBe(true);
	});

	test("Should load recently constructed link", async () => {
		const { tx, ctx, ctx2 } = prepare();
		const Test = makeClass();
		tx.deploy(Test, ctx2.owner.addressStr);
		await tx.publish();

		ctx2.activate();
		const tx2 = new LinkTransaction();
		const inst = tx2.update(() => new Test());
		await tx2.publish();
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000002_1");
		const { tx: chainTx } = await ctx2.getRawChainData("0000000000000000000000000000000000000000000000000000000000000002");
		expect(chainTx.txOuts.length).toBe(3);

		// seperate instance store
		const { ctx: ctx3 } = prepare({ api: ctx.api, provider: ctx.provider });
		ctx3.activate();
		const inst2 = await ctx3.load(Test, "0000000000000000000000000000000000000000000000000000000000000002_1");
		expect(inst2).toBeInstanceOf(Test);
	});

	test("Should load recently constructed link2", async () => {
		const { tx, ctx, ctx2 } = prepare();
		const Test = makeClass();
		tx.deploy(Test, ctx2.owner.addressStr);
		await tx.publish();

		if (ctx.api instanceof MockApi) {
			// mock utxo
			ctx.api.unspentUtxos[ctx2.owner.addressStr] = [
				{ tx_pos: 2, tx_hash: "8888000000000000000000000000000000000000000000000000000000002220", value: ctx.templateSatoshiValue }
			];
		}

		const tx2 = new LinkTransaction();
		const inst = tx2.update(() => new Test());
		await tx2.pay();
		tx2.sign();
		// will require template owners sig
		expect(tx2.isFullySigned()).toBe(false);
		ctx2.activate();
		tx2.sign();
		await tx2.publish({ pay: false });
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000002_1");
		const { tx: chainTx } = await ctx2.getRawChainData("0000000000000000000000000000000000000000000000000000000000000002");
		expect(chainTx.txOuts.length).toBe(4);

		// seperate instance store
		const { ctx: ctx3 } = prepare({ api: ctx.api, provider: ctx.provider });
		ctx3.activate();
		const inst2 = await ctx3.load(Test, "0000000000000000000000000000000000000000000000000000000000000002_1");
		expect(inst2).toBeInstanceOf(Test);
	});
});
