import { Address, PrivKey, PubKey, Tx } from "bsv";
import { Link, LinkSv } from "..";
import { MockApi } from "../apis/MockApi";
import { LinkTransaction } from "../LinkTransaction";
import { prepare } from "./Prepare.notest";
import { Sword } from "./Sword.notest";

describe("P2PKH", () => {
	test("Should resolve", () => {
		expect(Link).toEqual(expect.anything());
	});

	test("Should send sats", async () => {
		const { ctx } = prepare();
		const ltx = new LinkTransaction();
		const addy = Address.fromRandom();
		ltx.send(addy, 55555);
		const txid = await ltx.publish();
		expect(txid).toEqual("0000000000000000000000000000000000000000000000000000000000000001");
		const { tx, json } = await ctx.getRawChainData(txid);
		expect(json).toBe('{"o":[]}');
		expect(tx.txOuts.length).toBe(3);
		expect(tx.txOuts[1].valueBn.toNumber()).toBe(55555);
		expect(tx.txOuts[1].script.chunks[2].buf.toString("hex")).toBe(addy.hashBuf.toString("hex"));
	});

	test("Should send sats with low balance", async () => {
		const purse = PrivKey.fromRandom();
		const { ctx } = prepare({
			purse,
			api: new MockApi(true, {
				[Address.fromPubKey(PubKey.fromPrivKey(purse)).toString()]: [
					{ tx_pos: 1, tx_hash: "0000000000000000000000000000000000000000000000000000000000000000", value: 1000 }
				]
			})
		});
		const ltx = new LinkTransaction();
		const addy = Address.fromRandom();
		ltx.send(addy, 800);
		const txid = await ltx.publish();
		expect(txid).toEqual("0000000000000000000000000000000000000000000000000000000000000001");
	});

	test("Edit include P2PKH output in link transaction", async () => {
		const { ctx } = prepare();
		const ltx = new LinkTransaction();
		const inst = ltx.update(() => new Sword("cool sword"));
		ltx.update(() => inst.changeName("gg"));
		const addy = Address.fromRandom();
		ltx.send(addy, 55555);
		const txid = await ltx.publish();
		expect(txid).toEqual("0000000000000000000000000000000000000000000000000000000000000001");
		const { tx, json } = await ctx.getRawChainData(txid);
		expect(json).toBe('{"i":[-1],"o":[{"name":"gg","nonce":1}]}');
		expect(tx.txOuts.length).toBe(4);
		expect(tx.txOuts[2].valueBn.toNumber()).toBe(55555);
		expect(tx.txOuts[2].script.chunks[2].buf.toString("hex")).toBe(addy.hashBuf.toString("hex"));
	});

	test("Rollback should clear P2PKH send", async () => {
		const { ctx } = prepare();
		const ltx = new LinkTransaction();
		ltx.update(() => new Sword("cool sword"));
		const addy = Address.fromRandom();
		ltx.send(addy, 55555);
		ltx.rollback();
		ltx.update(() => new Sword("cool sword2"));
		const txid = await ltx.publish();
		expect(txid).toEqual("0000000000000000000000000000000000000000000000000000000000000001");
		const { tx, json } = await ctx.getRawChainData(txid);
		expect(json).toBe('{"i":[-1],"o":[{"name":"cool sword2","nonce":1}]}');
		expect(tx.txOuts.length).toBe(3);
		expect(tx.txOuts.some(x => x.valueBn.toNumber() === 55555)).toBe(false);
	});

	test("Clear should clear P2PKH send", async () => {
		const { ctx } = prepare();
		const ltx = new LinkTransaction();
		ltx.update(() => new Sword("cool sword"));
		const addy = Address.fromRandom();
		ltx.send(addy, 55555);
		ltx.clear();
		ltx.update(() => new Sword("cool sword2"));
		const txid = await ltx.publish();
		expect(txid).toEqual("0000000000000000000000000000000000000000000000000000000000000001");
		const { tx, json } = await ctx.getRawChainData(txid);
		expect(json).toBe('{"i":[-1],"o":[{"name":"cool sword2","nonce":1}]}');
		expect(tx.txOuts.length).toBe(3);
		expect(tx.txOuts.some(x => x.valueBn.toNumber() === 55555)).toBe(false);
	});

	test("Should serialize P2PKH output in link transaction", async () => {
		const { ctx } = prepare();
		let ltx = new LinkTransaction();
		const inst = ltx.update(() => new Sword("cool sword"));
		// pub it so we can export
		await ltx.publish();
		ltx = new LinkTransaction();
		ltx.update(() => inst.changeName("gg"));
		const addy = Address.fromRandom();
		ltx.send(addy, 55555);
		const jsonExport = ltx.export();
		const tx2 = await ctx.import(jsonExport);
		const txid = await tx2.publish();
		expect(txid).toEqual("0000000000000000000000000000000000000000000000000000000000000002");
		const { tx, json } = await ctx.getRawChainData(txid);
		expect(json).toBe('{"o":[{"origin":"0000000000000000000000000000000000000000000000000000000000000001_1","name":"gg","nonce":2}]}');
		expect(tx.txOuts.length).toBe(4);
		expect(tx.txOuts[2].valueBn.toNumber()).toBe(55555);
		expect(tx.txOuts[2].script.chunks[2].buf.toString("hex")).toBe(addy.hashBuf.toString("hex"));
	});

	test("Should fail not enough funds", async () => {
		const { tx } = prepare();
		const inst = tx.update(() => new Sword("cool sword"));
		tx.update(() => inst.changeName("gg"));
		const addy = Address.fromRandom();
		tx.send(addy, 2e8);
		expect(tx.publish()).rejects.toThrow(/Not enough funds. Needed \d+ more satoshis/);
	});
});
