import * as bsv from 'bsv'
import { WhatsOnChainApi } from './apis/WhatsOnChain';
import { IApiProvider } from './IApiProvider';
import { Transaction } from "./Transaction";

export class LinkContext {
	readonly wallet: Keys;
	readonly api: IApiProvider;

	constructor(opts: { wallet: string, api?: IApiProvider }) {
		const purseKey = bsv.PrivKey.fromString(opts.wallet);
		const pursePub = bsv.PubKey.fromPrivKey(purseKey);
		const purseAddress = bsv.Address.fromPubKey(pursePub);
		this.api = opts.api || new WhatsOnChainApi()
		this.wallet = {
			privateKey: purseKey,
			publicKey: pursePub,
			address: purseAddress
		};
		LinkContext.activeContext = this;
	}

	static activeContext: LinkContext;

	activate() {
		LinkContext.activeContext = this;
	}

	newTransaction() {
		return new Transaction(this);
	}
}

type Keys = {
	privateKey: bsv.PrivKey;
	publicKey: bsv.PubKey;
	address: bsv.Address;
};
