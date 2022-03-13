import { ICompression } from "../ICompression";

/**
 * Don't compress the data written to chain.
 */
export class NoCompression implements ICompression {
	compress(json: string): Buffer {
		return Buffer.from(json);
	}
	decompress(data: Buffer[]): string {
		const buf = data[data.length - 1];
		const raw = buf.toString();
		return raw;
	}
}
