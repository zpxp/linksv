import { PrivKey, PubKey, Address } from "bsv";
import { ChainClass, Link, LinkContext, LinkSv, LinkTemplate, LinkTransaction, MockApi, MockProvider, MockUtxoStore } from "..";
import { prepare } from "./Prepare.notest";
import { Sword } from "./Sword.notest";

describe("Context", () => {
	test("Should get purse utxos", async () => {
		const { ctx } = prepare();
		let bn = await ctx.getPurseBalance();
		expect(bn.toNumber()).toBe(100000110);
		bn = await ctx.getPurseBalance();
		expect(bn.toNumber()).toBe(100000110);
	});

	test("Should change fee", async () => {
		const pursePk = PrivKey.fromRandom();
		const ownerPk = PrivKey.fromRandom();
		const pursePub = PubKey.fromPrivKey(pursePk);
		const purseAddr = Address.fromPubKey(pursePub);

		const ctx = new LinkContext({
			purse: pursePk.toString(),
			owner: ownerPk.toString(),
			app: "test",
			satoshisPerByteFee: 0.001,
			provider: new MockProvider(),
			api: new MockApi(true, {
				[purseAddr.toString()]: [
					{ tx_pos: 1, tx_hash: "0000000000000000000000000000000000000000000000000000000000000000", value: 1e8 }
				]
			}),
			utxoStore: new MockUtxoStore()
		});
		ctx.activate();

		const balance = await ctx.getPurseBalance();
		expect(balance.toNumber()).toBe(1e8);

		const ltx = new LinkTransaction();

		const largeData = Buffer.alloc(6000, 1)

		ltx.update(() => new Sword(largeData.toString("hex")));
		const txid = await ltx.publish();
		const { tx } = await ctx.getRawChainData(txid);
		const change = tx.txOuts[tx.txOuts.length - 1].valueBn;
		expect(balance.sub(change).toNumber()).toBe(112);
	});

	test("Should change fee 2", async () => {
		const pursePk = PrivKey.fromRandom();
		const ownerPk = PrivKey.fromRandom();
		const pursePub = PubKey.fromPrivKey(pursePk);
		const purseAddr = Address.fromPubKey(pursePub);

		const ctx = new LinkContext({
			purse: pursePk.toString(),
			owner: ownerPk.toString(),
			app: "test",
			satoshisPerByteFee: 5,
			provider: new MockProvider(),
			api: new MockApi(true, {
				[purseAddr.toString()]: [
					{ tx_pos: 1, tx_hash: "0000000000000000000000000000000000000000000000000000000000000000", value: 1e8 }
				]
			}),
			utxoStore: new MockUtxoStore()
		});
		ctx.activate();

		const balance = await ctx.getPurseBalance();
		expect(balance.toNumber()).toBe(1e8);

		const ltx = new LinkTransaction();

		const largeData = Buffer.alloc(6000, 1)
		ltx.update(() => new Sword(largeData.toString("hex")));
		const txid = await ltx.publish();
		const { tx } = await ctx.getRawChainData(txid);
		const change = tx.txOuts[tx.txOuts.length - 1].valueBn;
		expect(balance.sub(change).toNumber()).toBe(1451);
	});
});
