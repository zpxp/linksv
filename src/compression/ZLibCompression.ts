import pako from "pako";

import { ICompression } from "../ICompression";

/**
 * Compress data json on chain with zlib compression
 */
export class ZLibCompression implements ICompression {
	compress(json: string): Buffer {
		return Buffer.from(pako.deflateRaw(json));
	}
	decompress(data: Buffer[]): string {
		const raw = data.toString();
		if (/^\{.*\}$|^\[.*\]$/.test(raw)) {
			// is json
			return raw;
		} else {
			// is compressed
			const buf = data[data.length - 1];
			const ui32 = new Uint8Array(buf, buf.byteOffset, buf.byteLength / Uint8Array.BYTES_PER_ELEMENT);
			return pako.inflateRaw(ui32, { to: "string" });
		}
	}
}
