import * as bsv from "bsv";

export interface IApiProvider {
	getUnspentUtxos(address: string):  Promise<Utxo[]>;
}

export type Utxo = { height: number; tx_pos: number; tx_hash: string; value: number };
