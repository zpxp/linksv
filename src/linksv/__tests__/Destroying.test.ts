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
		expect(inst.satoshis).toEqual(LINK_DUST);
		tx = new LinkTransaction();
		tx.update(() => inst.destroy());
		const txid = await tx.publish();
		expect(inst.satoshis).toEqual(0);
		const { json } = await ctx.getRawChainData(txid);
		expect(json).toEqual('{"o":[]}');
		expect(mock).toBeCalledTimes(2);
		expect(mock.mock.calls[1][0].destroyingTxid).toBeTruthy();
	});

	test("Should destroy 2", async () => {
		let { tx, ctx } = prepare();
		const inst = tx.update(() => new Car());
		await tx.publish();
		expect(inst.satoshis).toEqual(LINK_DUST);
		tx = new LinkTransaction();
		tx.update(() => inst.doDestroy());
		const txid = await tx.publish();
		expect(inst.satoshis).toEqual(0);
		const { json } = await ctx.getRawChainData(txid);
		expect(json).toEqual('{"o":[]}');
	});

	test("Should destroy and export import", async () => {
		let { tx, ctx, ctx2 } = prepare();
		const inst = tx.update(() => new Car());
		await tx.publish();
		expect(inst.satoshis).toEqual(LINK_DUST);
		tx = new LinkTransaction();
		tx.update(() => inst.doDestroy());
		const ex = tx.export();

		ctx2.activate();
		const tx2 = await ctx2.import(ex);
		expect(tx2.outputs.length).toBe(0);
		expect(tx2.inputs.length).toBe(1);
		expect(tx2.inputs[0].isDestroyed).toBe(true);
		const txid = await tx2.publish();
		expect(inst.satoshis).toEqual(0);
		const { json } = await ctx2.getRawChainData(txid);
		expect(json).toEqual('{"o":[]}');
	});

	test("Should destroy and record input indexes", async () => {
		let { tx, ctx } = prepare();
		const inst = tx.update(() => new Sword("cool sword"));
		const inst2 = tx.update(() => new Sword("cool sword"));
		const inst3 = tx.update(() => new Sword("cool sword"));
		await tx.publish();
		expect(inst.satoshis).toEqual(LINK_DUST);
		expect(inst2.satoshis).toEqual(LINK_DUST);
		expect(inst3.satoshis).toEqual(LINK_DUST);
		tx = new LinkTransaction();
		tx.update(() => inst.changeName("hh"));
		tx.update(() => inst2.destroy());
		tx.update(() => inst3.changeName("yy"));
		const txid = await tx.publish();
		expect(tx.outputs.length).toBe(2);
		expect(tx.inputs.length).toBe(3);
		expect(inst2.satoshis).toEqual(0);
		const { json } = await ctx.getRawChainData(txid);
		expect(json).toEqual(
			'{"i":[0,2],"o":[{"origin":"0000000000000000000000000000000000000000000000000000000000000001_1","name":"hh","nonce":2},{"origin":"0000000000000000000000000000000000000000000000000000000000000001_3","name":"yy","nonce":2}]}'
		);
		expect(inst.location).toEqual("0000000000000000000000000000000000000000000000000000000000000002_1");
		expect(inst3.location).toEqual("0000000000000000000000000000000000000000000000000000000000000002_2");
	});

	test("Should be indestructible", async () => {
		let { tx, ctx } = prepare();
		const inst = tx.update(() => new IndestructibleSword("cool sword"));
		await tx.publish();
		expect(inst.satoshis).toEqual(0);
		tx = new LinkTransaction();
		tx.update(() => inst.destroy());
		expect(tx.outputs.length).toBe(1);
		expect(tx.outputs[0].satoshis).toBe(0);
		const txid = await tx.publish();
		expect(inst.satoshis).toEqual(0);
		const { json } = await ctx.getRawChainData(txid);
		expect(json).toEqual(
			'{"o":[{"origin":"0000000000000000000000000000000000000000000000000000000000000001_1","name":"cool sword","nonce":2}]}'
		);
	});
});
