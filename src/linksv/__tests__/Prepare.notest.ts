import { PrivKey, Address, PubKey } from "bsv";
import { LinkContext, MockProvider, MockApi, MockUtxoStore, LinkTransaction, IApiProvider, ILinkProvider, ICompression } from "..";

export function prepare(
	opts: {
		api?: IApiProvider;
		provider?: ILinkProvider;
		serialUntracked?: boolean;
		compression?: ICompression;
		purse?: PrivKey;
		owner?: PrivKey;
		appName?: string;
	} = {}
) {
	const pursePk = opts.purse || PrivKey.fromRandom();
	const ownerPk = opts.owner || PrivKey.fromRandom();
	const ownerPub = PubKey.fromPrivKey(ownerPk);
	const ownerAddr = Address.fromPubKey(ownerPub);

	const ownerPk2 = PrivKey.fromRandom();
	const ownerPub2 = PubKey.fromPrivKey(ownerPk2);
	const ownerAddr2 = Address.fromPubKey(ownerPub2);

	const ctx2 = new LinkContext({
		purse: pursePk.toString(),
		owner: ownerPk2.toString(),
		allowSerializeNewLinks: opts.serialUntracked,
		compression: opts.compression,
		app: opts.appName ?? "test",
		provider: opts.provider || new MockProvider(),
		api: opts.api || new MockApi(true),
		utxoStore: new MockUtxoStore()
	});

	const ctx = new LinkContext({
		purse: pursePk.toString(),
		owner: ownerPk.toString(),
		allowSerializeNewLinks: opts.serialUntracked,
		compression: opts.compression,
		app: opts.appName ?? "test",
		provider: ctx2.provider,
		api: ctx2.api,
		utxoStore: ctx2.utxoStore
	});

	ctx.activate();
	const tx = new LinkTransaction();

	return { ctx, tx, pursePk, ownerPk, ownerPub, ownerPub2, ownerAddr, ctx2, ownerAddr2 };
}
