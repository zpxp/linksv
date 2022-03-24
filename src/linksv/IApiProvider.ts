import { Tx } from "bsv";

export interface IApiProvider {
	getUnspentUtxos(address: string): Promise<Utxo[]>;
	broadcast(txraw: string): Promise<string>;
	getTx(txid: string): Promise<Tx>;
	getBulkTx(txids: string[]): Promise<{[txid: string]: Tx}>;
}

export type Utxo = { tx_pos: number; tx_hash: string; value: number };
