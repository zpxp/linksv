import { ICompression } from "../ICompression";

/**
 * Don't compress the data written to chain.
 */
export class NoCompression implements ICompression {
	compress(data: Buffer): Buffer {
		return data;
	}
	decompress(data: Buffer): Buffer {
		return data;
	}
}
