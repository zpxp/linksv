import { ICompression } from "../ICompression";
import pako from "pako";

/**
 * Not as effective as `ZLibCompression` but offers far better compatibility with systems outside of javascript
 */
export class GZipCompression implements ICompression {
	compress(data: Buffer): Buffer {
		return Buffer.from(pako.gzip(data));
	}
	decompress(data: Buffer): Buffer {
		const ui32 = new Uint8Array(data, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
		return Buffer.from(pako.ungzip(ui32));
	}
}
