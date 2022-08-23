/* eslint-disable prefer-const */
import { Script, Tx, TxBuilder, Constants, Bn, OpCode, KeyPair, TxOut, TxVerifier, Interp, Address, PrivKey, PubKey } from "bsv";
import { Link, LinkSv, LinkTransaction, MockProvider } from "..";
import { MockApi } from "../apis/MockApi";
import { SigHash } from "../Constants";
import { getUnderlying } from "../InstanceProxy";
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

		// first write to chain is nonce 1
		chainRec.o[0].nonce = 1;

		const data = ctx.compression.compress(Buffer.from(JSON.stringify(chainRec)));
		const script = new Script();
		script.writeOpCode(OpCode.OP_FALSE);
		script.writeOpCode(OpCode.OP_RETURN);
		script.writeBuffer(Buffer.from(ctx.app));
		// blank header, no files
		script.writeBuffer(Buffer.alloc(0));
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
		expect(json).toBe('{"d":[0],"i":[-1],"o":[{"satoshis":111,"location":null,"origin":null,"testName":"name","nonce":1}]}');
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
			o: [new TestLink(), getUnderlying(inst)]
		};

		// first write to chain is nonce 1
		chainRec.o[0].nonce = 1;
		chainRec.o[1].nonce++;

		const data = ctx.compression.compress(Buffer.from(JSON.stringify(chainRec)));
		const script = new Script();
		script.writeOpCode(OpCode.OP_FALSE);
		script.writeOpCode(OpCode.OP_RETURN);
		script.writeBuffer(Buffer.from(ctx.app));
		// blank header, no files
		script.writeBuffer(Buffer.alloc(0));
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

	test("Should fork spent link", async () => {
		let { tx, ctx } = prepare();

		const inst = tx.update(() => new Sword("cool sword"));
		await tx.publish();
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");

		tx = new LinkTransaction();
		tx.update(() => inst.changeName("name1"));
		await tx.publish();
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000002_1");
		expect(inst.nonce).toBe(2);

		tx = new LinkTransaction();
		tx.update(() => inst.changeName("name2"));
		await tx.publish();
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000003_1");
		expect(inst.nonce).toBe(3);

		// remove its instance so we can load an old value
		ctx.purge(inst);

		const loaded = await ctx.load(Sword, "0000000000000000000000000000000000000000000000000000000000000002_1");
		expect(loaded.location).toBe("0000000000000000000000000000000000000000000000000000000000000002_1");
		expect(loaded.owner).toBe(ctx.owner.addressStr);

		// fork an old location
		tx = new LinkTransaction();
		tx.fork(loaded);
		expect(loaded.location).toBe(null);
		expect(loaded.forkOf).toBe("0000000000000000000000000000000000000000000000000000000000000002_1");
		expect(loaded.nonce).toBe(2);
		tx.update(() => loaded.changeName("name3"));
		const txid = await tx.publish();
		expect(loaded.location).toBe("0000000000000000000000000000000000000000000000000000000000000004_1");
		expect(loaded.nonce).toBe(3);
		const { json, tx: chainTx } = await ctx.getRawChainData(txid);
		expect(chainTx.txIns.length).toBe(1);
		expect(chainTx.txOuts.length).toBe(3);
		expect(json).toBe(
			'{"i":[-1],"o":[{"origin":"0000000000000000000000000000000000000000000000000000000000000001_1","name":"name3","nonce":3,"forkOf":"0000000000000000000000000000000000000000000000000000000000000002_1"}]}'
		);

		tx = new LinkTransaction();
		tx.update(() => loaded.changeName("name4"));
		const txid2 = await tx.publish();
		expect(loaded.location).toBe("0000000000000000000000000000000000000000000000000000000000000005_1");
		expect(loaded.forkOf).toBeFalsy();
		expect(loaded.nonce).toBe(4);

		const { json: json2, tx: chainTx2 } = await ctx.getRawChainData(txid2);
		expect(chainTx2.txIns.length).toBe(2);
		expect(chainTx2.txOuts.length).toBe(3);
		expect(Buffer.from(chainTx2.txIns[0].txHashBuf).reverse().toString("hex")).toBe(
			"0000000000000000000000000000000000000000000000000000000000000004"
		);
		expect(json2).toBe(
			'{"o":[{"origin":"0000000000000000000000000000000000000000000000000000000000000001_1","name":"name4","nonce":4}]}'
		);
	});

	test("Should not fork new link", async () => {
		let { tx, ctx } = prepare();

		const inst = tx.update(() => new Sword("cool sword"));
		tx.fork();
		await tx.publish();
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");
		expect(inst.origin).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");
	});

	test("Should not fork new link 2", async () => {
		let { tx, ctx } = prepare();

		const inst = tx.update(() => new Sword("cool sword"));
		const newTx = new LinkTransaction();
		newTx.fork(tx.outputs as Link[]);
		await newTx.publish();
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");
		expect(inst.origin).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");
	});

	test("Should clear fork", async () => {
		let { tx, ctx } = prepare();

		const inst = tx.update(() => new Sword("cool sword"));
		await tx.publish();

		tx = new LinkTransaction();
		tx.update(() => inst.changeName("name"));
		tx.fork();
		expect(inst.location).toBe(null);
		tx.update(() => inst.changeName("name2"));
		tx.clear();
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");
		expect(inst.name).toBe("name2");
	});

	test("Should rollback fork", async () => {
		let { tx, ctx } = prepare();

		const inst = tx.update(() => new Sword("cool sword"));
		await tx.publish();

		tx = new LinkTransaction();
		tx.update(() => inst.changeName("name"));
		tx.fork();
		expect(inst.location).toBe(null);
		tx.update(() => inst.changeName("name2"));
		tx.rollback();
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");
		expect(inst.name).toBe("cool sword");
	});

	test("Should fork and not make input", async () => {
		const purse = PrivKey.fromRandom();
		let { ctx, tx } = prepare({
			purse,
			api: new MockApi(true, {
				[Address.fromPubKey(PubKey.fromPrivKey(purse)).toString()]: [
					// only use a single purse utxo so final tx inputs are 1
					{ tx_pos: 1, tx_hash: "0000000000000000000000000000000000000000000000000000000000000000", value: 88888 }
				]
			})
		});

		const inst = tx.update(() => new Sword("cool sword"));
		await tx.publish();
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");

		tx = new LinkTransaction();
		tx.update(() => inst.changeName("name1"));
		tx.fork();
		const txid = await tx.publish();
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000002_1");
		expect(inst.nonce).toBe(2);

		const { json, tx: chainTx } = await ctx.getRawChainData(txid);
		expect(chainTx.txIns.length).toBe(1);
		expect(chainTx.txOuts.length).toBe(3);
	});

	test("Should record input indexes with destroyed equal to output", async () => {
		let { tx, ctx } = prepare();

		const inst1 = tx.update(() => new Sword("cool sword"));
		const inst2 = tx.update(() => new Sword("cool sword"));
		const inst3 = tx.update(() => new Sword("cool sword"));
		await tx.publish();

		tx = new LinkTransaction();
		tx.update(() => new Sword("cool sword"));
		tx.update(() => new Sword("cool sword"));
		tx.update(() => {
			inst1.destroy();
			inst2.destroy();
			inst3.destroy();
		});
		tx.update(() => new Sword("cool sword"));

		const txid = await tx.publish();
		const { json } = await ctx.getRawChainData(txid);
		expect(json).toBe(
			'{"i":[-1,-1,-1],"o":[{"name":"cool sword","nonce":1},{"name":"cool sword","nonce":1},{"name":"cool sword","nonce":1}],"d":[0,1,2]}'
		);
	});

	test("Should sign with sighash none", async () => {
		let { tx, ctx } = prepare();

		const inst = tx.update(() => new Sword("cool sword"));
		await tx.publish();

		const [txid, idx] = inst.location.split("_", 2);
		tx = new LinkTransaction();
		tx.update(() => inst.changeName("gg"));
		tx.setInputSignatureHashType(txid, idx, SigHash.NONE | SigHash.ANYONECANPAY);
		const g = await tx.publish();
		const { tx: result } = await ctx.getRawChainData(g);
		const inputBuf = result.txIns[0].script.chunks[0].buf;
		expect(inputBuf[inputBuf.length - 1]).toBe(SigHash.NONE | SigHash.ANYONECANPAY);
		// purse input
		const input2Buf = result.txIns[1].script.chunks[0].buf;
		expect(input2Buf[input2Buf.length - 1]).toBe(SigHash.ALL | SigHash.FORKID);
	});

	test("Should get estimated fee", async () => {
		let { tx, ctx, ownerAddr2 } = prepare();

		tx.update(() => new Sword("cool sword"));
		await tx.build();
		expect(tx.getEstimatedFee()).toBe(122);

		tx = new LinkTransaction();
		tx.update(() => new Sword("cool sword"));
		tx.send(ownerAddr2.toString(), 1000);
		await tx.build();
		expect(tx.getEstimatedFee()).toBe(1126);
	});

	test("Should get estimated fee 2", async () => {
		let { tx, ctx, ownerAddr2 } = prepare();

		if (ctx.api instanceof MockApi) {
			// tests for bsv lib estimate size bug
			ctx.api.unspentUtxos[ctx.purse.addressStr] = [
				{ tx_pos: 2, tx_hash: "8888000000000000000000000000000000000000000000000000000000002220", value: 29 },
				{ tx_pos: 3, tx_hash: "8888000000000000000000000000000000000000000000000000000000002220", value: 2000 }
			];
		}

		tx.update(() => new Sword("cool sword"));
		await tx.build();
		expect(tx.getEstimatedFee()).toBe(122);

		tx = new LinkTransaction();
		tx.update(() => new Sword("cool sword"));
		tx.send(ownerAddr2.toString(), 1000);
		await tx.build();
		expect(tx.getEstimatedFee()).toBe(1126);
	});
});
