import { Utxo } from "./IApiProvider";

export interface IUtxoStore {
	remove(myAddress: string, utxo: Utxo): Promise<void>;
	removeAll(myAddress: string): Promise<void>;
	setUnspent(address: string, utxos: Utxo[]): Promise<void>;
	getUnspent(address: string, value:number): Promise<Utxo[]>;
}
