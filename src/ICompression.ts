
/**
 * Control how json data is written to chain
 */
export interface ICompression {
	compress(json: string): Buffer;
	decompress(data: Buffer[]): string;
}
