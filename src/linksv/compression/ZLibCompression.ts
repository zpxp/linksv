import pako from "pako";

import { ICompression } from "../ICompression";

/**
 * Compress data json on chain with zlib compression
 */
export class ZLibCompression implements ICompression {
	compress(data: Buffer): Buffer {
		return Buffer.from(pako.deflateRaw(data));
	}

	decompress(data: Buffer): Buffer {
		// is compressed
		const ui32 = new Uint8Array(data, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
		return Buffer.from(pako.inflateRaw(ui32));
	}
}
