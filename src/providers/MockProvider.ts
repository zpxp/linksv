import { ILinkProvider, ProviderData } from "../ILinkProvider";

/**
 * In memory provider for testing
 */
export class MockProvider implements ILinkProvider {
	mockStore: { [origin: string]: ProviderData[] } = {};

	bulkAddLocation(data: ProviderData[]): Promise<void> {
		for (const item of data) {
			this.mockStore[item.origin] ||= [];
			this.mockStore[item.origin].push({ ...item });
		}
		return Promise.resolve();
	}

	addLocation(data: ProviderData): Promise<void> {
		this.mockStore[data.origin] ||= [];
		this.mockStore[data.origin].push({ ...data });
		return Promise.resolve();
	}

	getLatestLocationForOrigin(origin: string) {
		return Promise.resolve(this.mockStore[origin]?.sort((a, b) => a.nonce - b.nonce)[0]);
	}

	bulkGetLatestLocationForOrigin(origins: string[]): Promise<TT> {
		return Promise.resolve(
			Object.fromEntries(origins.map(origin => this.mockStore[origin]?.sort((a, b) => b.nonce - a.nonce)[0]).map(x => [x.origin, x]))
		);
	}
}

type TT = { [origin: string]: { location: string; nonce: number } };
