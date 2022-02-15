import { IApiProvider, Utxo } from "../IApiProvider";

export class WhatsOnChainApi implements IApiProvider {
	getUnspentUtxos(address: string): Promise<Utxo[]> {
		return fetch(`https://api.whatsonchain.com/v1/bsv/test/address/${address}/unspent`).then((d) => d.json() as any as Utxo[]);
	}
}
