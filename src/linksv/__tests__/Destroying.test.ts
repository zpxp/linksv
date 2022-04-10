/* eslint-disable prefer-const */
import { Link, LinkSv, LINK_DUST, LinkTransaction, LinkTemplate, MockProvider } from "..";
import { prepare } from "./Prepare.notest";
import { Sword } from "./Sword.notest";

@LinkTemplate("IndestructibleSword")
export class IndestructibleSword extends Link {
	name: string;
	owner: string;

	static zeroSatInstances = true;

	constructor(name: string) {
		super();

		this.name = name;
		this.satoshis = 0;
	}

	changeName(name: string) {
		this.name = name;
	}
}

@LinkTemplate("Car")
export class Car extends Link {
	constructor() {
		super();
	}

	doDestroy() {
		this.destroy();
	}
}

describe("link", () => {
	test("Should destroy", async () => {
		const mockProvider = new MockProvider();
		const mock = jest.fn(mockProvider.addLocation);
		mockProvider.addLocation = mock;
		let { tx, ctx } = prepare({ provider: mockProvider });
		const inst = tx.update(() => new Sword("cool sword"));
		await tx.publish();
		expect(inst.satoshis).toBe(LINK_DUST);
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");
		tx = new LinkTransaction();
		tx.update(() => inst.destroy());
		expect(tx.inputs[0].location).toBe(inst.location);
		const txid = await tx.publish();
		expect(inst.satoshis).toBe(0);
		const { json } = await ctx.getRawChainData(txid);
		expect(json).toBe('{"o":[],"d":[0]}');
		expect(mock).toBeCalledTimes(2);
		expect(mock.mock.calls[1][0].destroyingTxid).toBe("0000000000000000000000000000000000000000000000000000000000000002");
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000002_0");
	});

	test("Should destroy 2", async () => {
		let { tx, ctx } = prepare();
		const inst = tx.update(() => new Car());
		await tx.publish();
		expect(inst.satoshis).toBe(LINK_DUST);
		tx = new LinkTransaction();
		tx.update(() => inst.doDestroy());
		const txid = await tx.publish();
		expect(inst.satoshis).toBe(0);
		const { json } = await ctx.getRawChainData(txid);
		expect(json).toBe('{"o":[],"d":[0]}');
	});

	test("Should load destroyed link", async () => {
		let { tx, ctx } = prepare();
		const inst = tx.update(() => new Sword("cool sword"));
		await tx.publish();
		tx = new LinkTransaction();
		tx.update(() => inst.destroy());
		await tx.publish();

		// make a new context so we dont load the same ref
		let { ctx: ctx2 } = prepare({ api: ctx.api, provider: ctx.provider });
		const inst2 = await ctx2.load(Sword, inst.location);
		expect(inst2.isDestroyed).toBe(true);
		expect(inst2[LinkSv.IsProxy]).toBeFalsy();
	});

	test("Should destroy without first publishing", async () => {
		let { tx, ctx } = prepare();
		const inst = tx.update(() => new Car());
		expect(inst.satoshis).toBe(LINK_DUST);
		tx.update(() => inst.destroy());
		const txid = await tx.publish();
		expect(inst.satoshis).toBe(0);
		const { json } = await ctx.getRawChainData(txid);
		expect(json).toBe('{"o":[],"d":[-1]}');
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_0");
	});

	test("Should destroy and export import", async () => {
		let { tx, ctx, ctx2 } = prepare();
		const inst = tx.update(() => new Car());
		await tx.publish();
		expect(inst.satoshis).toBe(LINK_DUST);
		tx = new LinkTransaction();
		tx.update(() => inst.doDestroy());
		await tx.pay();
		tx.sign();
		const ex = tx.export();

		ctx2.activate();
		const tx2 = await ctx2.import(ex);
		expect(tx2.outputs.length).toBe(0);
		expect(tx2.inputs.length).toBe(1);
		expect(tx2.inputs[0].isDestroyed).toBe(false);
		expect(tx2.txActions[0].linkProxy.isDestroyed).toBe(true);
		const txid = await tx2.publish({ pay: false });
		expect(inst.satoshis).toBe(0);
		const { json } = await ctx2.getRawChainData(txid);
		expect(json).toBe('{"o":[],"d":[0]}');
	});

	test("Should destroy and record input indexes", async () => {
		let { tx, ctx } = prepare();
		const inst = tx.update(() => new Sword("cool sword"));
		const inst2 = tx.update(() => new Sword("cool sword"));
		const inst3 = tx.update(() => new Sword("cool sword"));
		await tx.publish();
		expect(inst.satoshis).toBe(LINK_DUST);
		expect(inst2.satoshis).toBe(LINK_DUST);
		expect(inst3.satoshis).toBe(LINK_DUST);
		tx = new LinkTransaction();
		tx.update(() => inst.changeName("hh"));
		tx.update(() => inst2.destroy());
		tx.update(() => inst3.changeName("yy"));
		const txid = await tx.publish();
		expect(tx.outputs.length).toBe(2);
		expect(tx.inputs.length).toBe(3);
		expect(inst2.satoshis).toBe(0);
		const { json } = await ctx.getRawChainData(txid);
		expect(json).toBe(
			'{"i":[0,2],"o":[{"origin":"0000000000000000000000000000000000000000000000000000000000000001_1","name":"hh","nonce":2},{"origin":"0000000000000000000000000000000000000000000000000000000000000001_3","name":"yy","nonce":2}],"d":[1]}'
		);
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000002_1");
		expect(inst2.location).toBe("0000000000000000000000000000000000000000000000000000000000000002_0");
		expect(inst3.location).toBe("0000000000000000000000000000000000000000000000000000000000000002_2");
	});

	test("Should be indestructible", async () => {
		let { tx, ctx } = prepare();
		const inst = tx.update(() => new IndestructibleSword("cool sword"));
		await tx.publish();
		expect(inst.satoshis).toBe(0);
		tx = new LinkTransaction();
		tx.update(() => inst.destroy());
		expect(tx.outputs.length).toBe(1);
		expect(tx.outputs[0].satoshis).toBe(0);
		const txid = await tx.publish();
		expect(inst.isDestroyed).toBe(false);
		expect(inst.satoshis).toBe(0);
		const { json } = await ctx.getRawChainData(txid);
		expect(json).toBe(
			'{"o":[{"origin":"0000000000000000000000000000000000000000000000000000000000000001_1","name":"cool sword","nonce":2}]}'
		);
	});
});
