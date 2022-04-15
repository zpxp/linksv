
/**
 * Control how json data is written to chain
 */
export interface ICompression {
	compress(data: Buffer): Buffer;
	decompress(data: Buffer): Buffer;
}
