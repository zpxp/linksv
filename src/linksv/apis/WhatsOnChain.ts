import { IApiProvider, Utxo } from "../IApiProvider";
import axios from "axios";
import rateLimit from "axios-rate-limit";
import * as bsv from "bsv";
import { chunk } from "../Utils";

const http = rateLimit(axios.create(), { maxRPS: 3 });

export class WhatsOnChainApi implements IApiProvider {
	getTx(txid: string): Promise<bsv.Tx> {
		const istest = bsv.Constants.Default === bsv.Constants.Testnet;
		return http(`https://api.whatsonchain.com/v1/bsv/${istest ? "test" : "main"}/tx/${txid}/hex`, {
			responseType: "text"
		})
			.then(res => {
				if (res.status >= 400) {
					throw new Error(res.data);
				}
				return res.data;
			})
			.then(res => bsv.Tx.fromHex(res));
	}
	async getBulkTx(txids: string[]): Promise<{ [txid: string]: bsv.Tx }> {
		const istest = bsv.Constants.Default === bsv.Constants.Testnet;
		const res: bsv.Tx[][] = await Promise.all(
			chunk(
				txids.filter(x => !!x),
				20
			).map(x =>
				http(`https://api.whatsonchain.com/v1/bsv/${istest ? "test" : "main"}/txs/hex`, {
					method: "POST",
					data: {
						txids: x
					}
				}).then(res => {
					if (res.status >= 400) {
						throw new Error(res.data);
					}
					return res.data.map((x: { hex: string; error: any }) => {
						if (x.error) {
							throw new Error(x.error);
						}
						return bsv.Tx.fromHex(x.hex);
					});
				})
			)
		);
		return Object.fromEntries(res.flatMap(x => x.map(x => [x.hash().reverse().toString("hex"), x])));
	}
	broadcast(txraw: string): Promise<string> {
		const istest = bsv.Constants.Default === bsv.Constants.Testnet;
		return http(`https://api.whatsonchain.com/v1/bsv/${istest ? "test" : "main"}/tx/raw`, {
			method: "POST",
			responseType: "text",
			data: { txhex: txraw }
		})
			.then(res => {
				if (res.status >= 400) {
					throw new Error(res.data);
				}
				return res.data;
			})
			.then(r => r.replace(/["\s]+/g, ""));
	}
	getUnspentUtxos(address: string): Promise<Utxo[]> {
		const istest = bsv.Constants.Default === bsv.Constants.Testnet;
		return http(`https://api.whatsonchain.com/v1/bsv/${istest ? "test" : "main"}/address/${address}/unspent`).then(d => d.data);
	}
}
