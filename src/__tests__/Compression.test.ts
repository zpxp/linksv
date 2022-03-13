import { Link, LinkTransaction, LinkSv, LinkTemplate, ZLibCompression, NoCompression, EciesCompression } from "..";
import { prepare } from "./Prepare.notest";
import { Sword } from "./Sword.notest";

describe("Compression", () => {
	test("Should work with compression", async () => {
		const { tx, ctx } = prepare({ compression: new ZLibCompression() });

		tx.update(() => new Sword("cool sword"));
		const txid = await tx.publish();
		const { json } = await ctx.getRawChainData(txid);
		expect(json).toEqual('{"i":[-1],"o":[{"name":"cool sword","nonce":1}]}');
	});

	test("Should work with no compression", async () => {
		const { tx, ctx } = prepare({ compression: new NoCompression() });

		tx.update(() => new Sword("cool sword"));
		const txid = await tx.publish();
		const { json } = await ctx.getRawChainData(txid);
		expect(json).toEqual('{"i":[-1],"o":[{"name":"cool sword","nonce":1}]}');
	});

	test("Should work with ecies compression", async () => {
		const { tx, ctx } = prepare({ compression: new EciesCompression() });

		tx.update(() => new Sword("cool sword"));
		const txid = await tx.publish();
		const { json } = await ctx.getRawChainData(txid);
		expect(json).toEqual('{"i":[-1],"o":[{"name":"cool sword","nonce":1}]}');
	});

	test("Ecies should prevent others reading chain data", async () => {
		const { tx, ctx, ctx2 } = prepare({ compression: new EciesCompression() });

		tx.update(() => new Sword("cool sword"));
		const txid = await tx.publish();
		ctx2.activate();
		expect(ctx2.getRawChainData(txid)).rejects.toThrow("Invalid checksum");
	});
});
