import { ICompression } from "../ICompression";
import pako from "pako";


/**
 * Not as effective as `ZLibCompression` but offers far better compatibility with systems outside of javascript
 */
export class GZipCompression implements ICompression {
	compress(json: string): Buffer {
		return Buffer.from(pako.gzip(json));
	}
	decompress(data: Buffer[]): string {
		const buf = data[data.length - 1];
		// is compressed
		const ui32 = new Uint8Array(buf, buf.byteOffset, buf.byteLength / Uint8Array.BYTES_PER_ELEMENT);
		return pako.ungzip(ui32, { to: "string" });
	}
}