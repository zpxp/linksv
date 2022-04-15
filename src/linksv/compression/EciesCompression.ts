import { Ecies, KeyPair } from "bsv";
import { LinkContext } from "..";
import { ICompression } from "../ICompression";
import { ZLibCompression } from "./ZLibCompression";

/**
 * Compress chain data and encrypt it with the current owner's key.
 * Only this owner can read the data from chain with `LinkContext.load()`
 */
export class EciesCompression implements ICompression {
	dataCompress: ICompression = new ZLibCompression();

	compress(data: Buffer): Buffer {
		const compressed = this.dataCompress.compress(data);
		const encr = Ecies.electrumEncrypt(
			compressed,
			LinkContext.activeContext.owner.publicKey,
			KeyPair.fromPrivKey(LinkContext.activeContext.owner.privateKey)
		);
		return encr;
	}

	decompress(data: Buffer): Buffer {
		const decrypt = Ecies.electrumDecrypt(data, LinkContext.activeContext.owner.privateKey);
		return this.dataCompress.decompress(decrypt);
	}
}
