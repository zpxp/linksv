import { PrivKey, Address, PubKey } from "bsv";
import { LinkContext, MockProvider, MockApi, MockUtxoStore, LinkTransaction, IApiProvider, ILinkProvider, ICompression } from "..";

export function prepare(opts: { api?: IApiProvider; provider?: ILinkProvider, serialUntracked?: boolean, compression?: ICompression } = {}) {
	const pursePk = PrivKey.fromRandom();
	const ownerPk = PrivKey.fromRandom();
	const ownerAddr = Address.fromPubKey(PubKey.fromPrivKey(ownerPk));

	const ownerPk2 = PrivKey.fromRandom();
	const ownerAddr2 = Address.fromPubKey(PubKey.fromPrivKey(ownerPk));

	const ctx2 = new LinkContext({
		purse: pursePk.toString(),
		owner: ownerPk2.toString(),
		allowSerializeNewLinks: opts.serialUntracked,
		compression: opts.compression,
		app: "test",
		provider: opts.provider || new MockProvider(),
		api: opts.api || new MockApi(true),
		utxoStore: new MockUtxoStore()
	});

	const ctx = new LinkContext({
		purse: pursePk.toString(),
		owner: ownerPk.toString(),
		allowSerializeNewLinks: opts.serialUntracked,
		compression: opts.compression,
		app: "test",
		provider: ctx2.provider,
		api: ctx2.api,
		utxoStore: ctx2.utxoStore
	});

	ctx.activate();
	const tx = new LinkTransaction();

	return { ctx, tx, pursePk, ownerAddr, ctx2, ownerAddr2 };
}
