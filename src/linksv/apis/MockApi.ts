import { Tx } from "bsv";
import { ILink, LINK_DUST, RecordAction } from "..";
import { IApiProvider, Utxo } from "../IApiProvider";

/**
 * In memory api for testing
 */
export class MockApi implements IApiProvider {
	constructor(private useFakeHash = false, public unspentUtxos: { [address: string]: Utxo[] } = {}) {}

	mockStore: { [txid: string]: Tx } = {};
	count = 0;

	getUnspentUtxos(address: string): Promise<Utxo[]> {
		return Promise.resolve(
			this.unspentUtxos[address] || [
				{ tx_pos: 1, tx_hash: "0000000000000000000000000000000000000000000000000000000000000000", value: 1e8 },
				{ tx_pos: 2, tx_hash: "0000000000000000000000000000000000000000000000000000000000000000", value: LINK_DUST - 1 }
			]
		);
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	broadcast(txraw: string, actions?: [ILink, RecordAction[]][], isExternalTx?: boolean): Promise<string> {
		const tx = Tx.fromHex(txraw);
		const txid = this.useFakeHash ? pad(++this.count) : tx.hash().reverse().toString("hex");
		this.mockStore[txid] = tx;
		return Promise.resolve(txid);
	}
	getTx(txid: string): Promise<Tx> {
		return Promise.resolve(this.mockStore[txid]);
	}
	getBulkTx(txids: string[]): Promise<{ [txid: string]: Tx }> {
		txids = Array.from(new Set(txids)).filter(x => !!x);
		return Promise.resolve(Object.fromEntries(txids.map(x => [x, this.mockStore[x]])));
	}
}

function pad(num: number) {
	return "0000000000000000000000000000000000000000000000000000000000000000".substring(num.toString().length) + num;
}
