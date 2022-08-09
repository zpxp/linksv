import { ILinkProvider, ProviderData } from "../ILinkProvider";
import axios from "axios";
import axiosRetry from "axios-retry";
import { chunk } from "../Utils";

axiosRetry(axios, {
	retries: 10, // number of retries
	retryDelay: retryCount => {
		console.log(`retry attempt: ${retryCount}`);
		return retryCount * 500; // time interval between retries
	},
	retryCondition: error => {
		// if retry condition is not specified, by default idempotent requests are retried
		return error.response?.status >= 400;
	}
});


export class BackendLinkProvider implements ILinkProvider {
	constructor(public host: string) {}

	bulkAddLocation(data: ProviderData[]): Promise<void> {
		return axios(this.host + "/api/link/bulklocation", {
			withCredentials: true,
			method: "POST",
			data
		}).then(x => x.data);
	}

	addLocation(data: ProviderData): Promise<void> {
		return axios(this.host + "/api/link/location", {
			withCredentials: true,
			method: "POST",
			data
		}).then(x => x.data);
	}

	getLatestLocationForOrigin(origin: string) {
		return axios
			.get(this.host + "/api/link/latest", {
				withCredentials: true,
				params: {
					origin
				},
				method: "GET"
			})
			.then(x => x.data);
	}

	bulkGetLatestLocationForOrigin(origins: string[]): Promise<TT> {
		return Promise.all(
			chunk(origins, 10).map(os => {
				return axios(this.host + "/api/link/bulklatest", {
					withCredentials: true,
					data: os,
					method: "POST"
				}).then(x => x.data as TT);
			})
		).then(results => {
			return results.reduce((prev, next) => ({ ...prev, ...next }), {});
		});
	}
}

type TT = { [origin: string]: { location: string; nonce: number } };

