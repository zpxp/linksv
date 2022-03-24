export interface ILinkProvider {
	/**
	 * Return the latest location for given origin
	 * @param origin
	 */
	getLatestLocationForOrigin(origin: string): Promise<{ location: string; nonce: number }>;
	bulkGetLatestLocationForOrigin(origins: string[]): Promise<{ [origin: string]: { location: string; nonce: number } }>;
	/**
	 * Record a link location
	 * @param origin
	 * @param location
	 * @param nonce
	 */
	addLocation(data: ProviderData): Promise<void>;
	bulkAddLocation(data: ProviderData[]): Promise<void>;
}

export type ProviderData = { origin: string; location: string; nonce: number; owners: string[]; linkName: string };
