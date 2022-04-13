import { Script, Tx, TxBuilder, Constants, Bn, OpCode, KeyPair, TxOut, TxVerifier, Interp } from "bsv";
import { Link, LinkSv, LinkTransaction, MockProvider } from "..";
import { MockApi } from "../apis/MockApi";
import { LinkTemplate } from "../LinkTemplate";
import { ChainRecord } from "../LinkTransaction";
import { prepare } from "./Prepare.notest";
import { Sword } from "./Sword.notest";

@LinkTemplate("linktest")
class TestLink extends Link {
	static constructUntracked = true;
	testName = "name";
}

describe("Link Transaction", () => {
	test("Should import hex", async () => {
		const { ctx, ownerAddr, ownerPk } = prepare();

		const existingTx = new Tx();
		existingTx.addTxOut(TxOut.fromProperties(new Bn(ctx.linkSatoshiValue), Script.fromPubKeyHash(ownerAddr.hashBuf)));
		const location = existingTx.hash();

		const txb = new TxBuilder();
		txb.setDust(0);
		txb.inputFromPubKeyHash(location, 0, existingTx.txOuts[0]);

		const chainRec: ChainRecord = {
			d: [0],
			i: [-1],
			o: [new TestLink()]
		};

		const data = ctx.compression.compress(JSON.stringify(chainRec));
		const script = new Script();
		script.writeOpCode(OpCode.OP_FALSE);
		script.writeOpCode(OpCode.OP_RETURN);
		script.writeBuffer(Buffer.from(ctx.app));
		script.writeBuffer(data);

		txb.outputToScript(new Bn(0), script);
		txb.outputToAddress(new Bn(ctx.linkSatoshiValue), ownerAddr);

		const payUtxo = await ctx.api.getUnspentUtxos(ctx.purse.addressStr);
		const paymentTx = new Tx();
		paymentTx.addTxOut(TxOut.fromProperties(new Bn(payUtxo[0].value), Script.fromPubKeyHash(ctx.purse.address.hashBuf)));
		txb.inputFromPubKeyHash(paymentTx.hash(), 0, paymentTx.txOuts[0]);
		txb.setChangeAddress(ctx.purse.address);

		const outs = txb.buildOutputs();
		txb.buildInputs(outs, txb.txIns.length);
		txb.signWithKeyPairs([KeyPair.fromPrivKey(ownerPk)]);
		const hex = txb.tx.toHex();

		const tx = new LinkTransaction(hex, r => Object.setPrototypeOf(r, TestLink.prototype));
		// set input tx so we can sign
		tx.importTxMap([paymentTx, existingTx]);
		tx.fillSigMap(paymentTx, ctx.purse.addressStr);

		expect(tx.outputs.length).toBe(1);
		expect(tx.outputs[0]).toBeInstanceOf(TestLink);
		const txid = await tx.publish({ pay: false, sign: true });
		expect(txid).toBe("0000000000000000000000000000000000000000000000000000000000000001");
		const { json } = await ctx.getRawChainData(txid);
		expect(json).toBe('{"d":[0],"i":[-1],"o":[{"satoshis":111,"location":null,"origin":null,"testName":"name","nonce":0}]}');
	});

	test("Should import hex 2", async () => {
		const mockProvider = new MockProvider();
		const mock = jest.fn(mockProvider.bulkAddLocation);
		mockProvider.bulkAddLocation = mock;
		const { ctx, ownerAddr, ownerPk, tx: inittx, ctx2 } = prepare({ api: new MockApi(false), provider: mockProvider });

		ctx2.activate();
		const inst = inittx.update(() => new Sword("cool sword"));
		const txid1 = await inittx.publish();
		const { tx: existingTx1 } = await ctx.getRawChainData(txid1);
		// track it in ctx to see if it gets updated when we import
		ctx.addInstance(inst);

		const existingTx2 = new Tx();
		existingTx2.addTxOut(TxOut.fromProperties(new Bn(ctx.linkSatoshiValue), Script.fromPubKeyHash(ownerAddr.hashBuf)));
		const location1 = existingTx1.hash();
		const location2 = existingTx2.hash();

		const txb = new TxBuilder();
		txb.setDust(0);
		// destroyed link
		txb.inputFromPubKeyHash(location1, 1, existingTx1.txOuts[1]);
		// existing link
		txb.inputFromPubKeyHash(location2, 0, existingTx2.txOuts[0]);

		const chainRec: ChainRecord = {
			// index of destroyed input
			d: [1],
			// indexes of new/existing inputs
			i: [-1, 0],
			o: [new TestLink(), inst]
		};

		const data = ctx.compression.compress(JSON.stringify(chainRec));
		const script = new Script();
		script.writeOpCode(OpCode.OP_FALSE);
		script.writeOpCode(OpCode.OP_RETURN);
		script.writeBuffer(Buffer.from(ctx.app));
		script.writeBuffer(data);

		// script output
		txb.outputToScript(new Bn(0), script);

		// 2 link outputs
		txb.outputToAddress(new Bn(ctx.linkSatoshiValue), ownerAddr);
		txb.outputToAddress(new Bn(ctx.linkSatoshiValue), ctx2.owner.address);

		const payUtxo = await ctx.api.getUnspentUtxos(ctx.purse.addressStr);
		const paymentTx = new Tx();
		paymentTx.addTxOut(TxOut.fromProperties(new Bn(payUtxo[0].value), Script.fromPubKeyHash(ctx.purse.address.hashBuf)));
		txb.inputFromPubKeyHash(paymentTx.hash(), 0, paymentTx.txOuts[0]);
		txb.setChangeAddress(ctx.purse.address);

		const outs = txb.buildOutputs();
		txb.buildInputs(outs, txb.txIns.length);
		txb.signWithKeyPairs([KeyPair.fromPrivKey(ownerPk), KeyPair.fromPrivKey(ctx2.owner.privateKey)]);
		const hex = txb.tx.toHex();

		ctx.activate();
		const tx = new LinkTransaction(hex, r =>
			"testName" in r ? Object.setPrototypeOf(r, TestLink.prototype) : Object.setPrototypeOf(r, Sword.prototype)
		);
		// set input tx so we can sign
		tx.importTxMap([paymentTx, existingTx1, existingTx2]);
		tx.fillSigMap(paymentTx, ctx.purse.addressStr);

		expect(tx.outputs.length).toBe(2);
		expect(tx.outputs[0]).toBeInstanceOf(TestLink);
		expect(tx.outputs[1]).toBeInstanceOf(Sword);
		expect(tx.outputs[1].location).toBe(inst.location);
		const txid = await tx.publish({ pay: false, sign: true });
		// track outputs
		for (const output of tx.outputs) {
			expect(output[LinkSv.IsProxy]).toBe(true);
			if (output instanceof Link) {
				ctx.addInstance(output);
			}
		}
		expect(txid).toBeTruthy();

		expect(mock).toBeCalled();
		expect(mock.mock.calls[0][0]).toEqual([
			{
				destroyingTxid: undefined,
				linkName: "linktest",
				location: tx.outputs[0].location,
				nonce: 1,
				origin: tx.outputs[0].location,
				owners: [ownerAddr.toString()]
			},
			{
				destroyingTxid: undefined,
				linkName: "Sword",
				location: inst.location,
				nonce: 2,
				origin: inst.origin,
				owners: [inst.owner]
			}
			// note the destroyed link is not sent here. must be dealt with manually
		]);
	});
});
