import { Utxo } from "../IApiProvider";
import { IUtxoStore } from "../IUtxoStore";

export interface UtxoTable {
	txid: string;
	idx: number;
	address: string;
	value: number;
}

export class IndexedDbUtxoStore implements IUtxoStore {
	db: IDBDatabase;
	constructor() {
		const request = window.indexedDB.open("LinkUtxoStore", 1);
		request.onerror = (event: any) => {
			console.error("Database error: " + event.target.error);
		};
		request.onsuccess = event => {
			this.db = (event.target as any).result as IDBDatabase;
		};
		request.onupgradeneeded = event => {
			// Save the IDBDatabase interface
			const db = (event.target as any).result as IDBDatabase;

			// Create an objectStore for this database
			// utxos: "[txid+idx], address, value"
			const objectStore = db.createObjectStore("LinkUtxoStore", { keyPath: ["txid", "idx"] });
			objectStore.createIndex("pk", ["txid", "idx"], { unique: true });
			objectStore.createIndex("address", "address", { unique: false });
		};
	}

	removeAll(address: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = this.db
				.transaction("LinkUtxoStore", "readwrite")
				.objectStore("LinkUtxoStore")
				.index("address")
				.openCursor(address);

			request.onsuccess = (event: any) => {
				const cursor = event.target.result as IDBCursorWithValue;
				if (cursor) {
					if (cursor.value.address === address) {
						cursor.delete();
					}
					cursor.continue();
				} else {
					resolve();
				}
			};
			request.onerror = (event: any) => {
				reject(event.target.result);
			};
		});
	}

	remove(myAddress: string, utxo: Utxo): Promise<void> {
		// await this.utxos.delete([utxo.tx_hash, utxo.tx_pos]);
		return new Promise((resolve, reject) => {
			const request = this.db
				.transaction("LinkUtxoStore", "readwrite")
				.objectStore("LinkUtxoStore")
				.delete(IDBKeyRange.only([utxo.tx_hash, utxo.tx_pos]));
			request.onsuccess = event => {
				resolve();
			};
			request.onerror = (event: any) => {
				reject(event.target.result);
			};
		});
	}

	setUnspent(address: string, utxos: Utxo[]): Promise<void> {
		return new Promise((resolve, reject) => {
			const t = this.db.transaction("LinkUtxoStore", "readwrite");
			t.oncomplete = event => {
				resolve();
			};
			t.onerror = event => {
				reject((event.target as any).result);
			};

			const objectStore = t.objectStore("LinkUtxoStore");
			for (const utxo of utxos) {
				objectStore.add({ txid: utxo.tx_hash, idx: utxo.tx_pos, address, value: utxo.value });
			}
			t.commit();
		});
	}

	getUnspent(address: string, value: number): Promise<Utxo[]> {
		return new Promise((resolve, reject) => {
			const objectStore = this.db.transaction("LinkUtxoStore", "readonly").objectStore("LinkUtxoStore");

			const rtns: Utxo[] = [];

			objectStore.openCursor().onsuccess = (event: any) => {
				const cursor = event.target.result as IDBCursorWithValue;
				if (cursor) {
					const row: UtxoTable = cursor.value;
					if (row.address === address) {
						rtns.push({ tx_hash: row.txid, tx_pos: row.idx, value: row.value });
						if (value !== null) {
							value -= row.value;
						}
					}
					if (value !== null && value < 0) {
						resolve(rtns);
					} else {
						cursor.continue();
					}
				} else {
					resolve(rtns);
				}
			};
		});
	}
}
