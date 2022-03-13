import { Utxo } from "../IApiProvider";
import { IUtxoStore } from "../IUtxoStore";

import Dexie, { Table } from "dexie";

export interface UtxoTable {
	txid: string;
	idx: number;
	address: string;
	value: number;
}

export class IndexedDbUtxoStore extends Dexie implements IUtxoStore {
	constructor() {
		super("LinkUtxoStore");
		this.version(1).stores({
			utxos: "[txid+idx], address, value"
		});
	}

	async removeAll(address: string): Promise<void> {
		await this.utxos.where({ address }).delete();
	}

	utxos: Table<UtxoTable, [string, number]>;

	async remove(myAddress: string, utxo: Utxo): Promise<void> {
		await this.utxos.delete([utxo.tx_hash, utxo.tx_pos]);
	}

	async setUnspent(address: string, utxos: Utxo[]): Promise<void> {
		await this.utxos.bulkPut(utxos.map(x => ({ txid: x.tx_hash, idx: x.tx_pos, address, value: x.value })));
	}

	async getUnspent(address: string, value: number): Promise<Utxo[]> {
		const rows = await this.utxos.where({ address }).toArray();
		let rtns: Utxo[] = [];

		for (const row of rows) {
			rtns.push({ tx_hash: row.txid, tx_pos: row.idx, value: row.value });
			value -= row.value;
			if (value < 0) {
				break;
			}
		}

		return rtns;
	}
}
