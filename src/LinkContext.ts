import * as bsv from "bsv";
import { Records, Transaction } from "./Transaction";

export class LinkContext {
	wallet: Keys;

	constructor(opts: { wallet: string }) {
		const purseKey = bsv.PrivKey.fromString(opts.wallet);
		const pursePub = bsv.PubKey.fromPrivKey(purseKey);
		const purseAddress = bsv.Address.fromPubKey(pursePub);
		this.wallet = {
			privateKey: purseKey,
			publickKey: pursePub,
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
	publickKey: bsv.PubKey;
	address: bsv.Address;
};
