import { Ecies, KeyPair } from "bsv";
import { LinkContext } from "chain";
import { ICompression } from "../ICompression";
import { ZLibCompression } from "./ZLibCompression";

/**
 * Compress chain data and encrypt it with the current owner's key.
 * Only this owner can read the data from chain with `LinkContext.load()`
 */
export class EciesCompression implements ICompression {
	dataCompress = new ZLibCompression();

	compress(json: string): Buffer {
		const compressed = this.dataCompress.compress(json);
		const encr = Ecies.electrumEncrypt(
			compressed,
			LinkContext.activeContext.owner.publicKey,
			KeyPair.fromPrivKey(LinkContext.activeContext.owner.privateKey)
		);
		return encr;
	}
	decompress(data: Buffer[]): string {
		const buf = data[data.length - 1];
		const decrypt = Ecies.electrumDecrypt(buf, LinkContext.activeContext.owner.privateKey);
		return this.dataCompress.decompress([decrypt]);
	}
}
