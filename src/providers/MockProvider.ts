import { ILinkProvider } from "../ILinkProvider";


/**
 * In memory provider for testing
 */
export class MockProvider implements ILinkProvider {
	mockStore: { [origin: string]: { origin: string; location: string; nonce: number }[] } = {};

	bulkAddLocation(data: { origin: string; location: string; nonce: number }[]): Promise<void> {
		for (const item of data) {
			this.mockStore[item.origin] ||= [];
			this.mockStore[item.origin].push(item);
		}
		return Promise.resolve();
	}

	addLocation(origin: string, location: string, nonce: number): Promise<void> {
		this.mockStore[origin] ||= [];
		this.mockStore[origin].push({ origin, location, nonce });
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
