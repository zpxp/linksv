import { Utxo } from "../IApiProvider";
import { IUtxoStore } from "../IUtxoStore";


/**
 * in memory utxo store
 */
export class MockUtxoStore implements IUtxoStore {
	mockStore: { [address: string]: Utxo[] } = {};
	remove(myAddress: string, utxo: Utxo): Promise<void> {
		delete this.mockStore[myAddress];
		return Promise.resolve();
	}
	removeAll(myAddress: string): Promise<void> {
		delete this.mockStore[myAddress];
		return Promise.resolve();
	}
	setUnspent(address: string, utxos: Utxo[]): Promise<void> {
		this.mockStore[address] ||= [];
		this.mockStore[address].push(...utxos);
		return Promise.resolve();
	}
	getUnspent(address: string, value: number): Promise<Utxo[]> {
		return Promise.resolve(this.mockStore[address] || []);
	}
}
