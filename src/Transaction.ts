import { Bn, TxBuilder, TxOut, deps, Script } from "bsv";
import { LinkContext } from "src";

export class Transaction {
	readonly ctx: LinkContext;
	constructor(ctx: LinkContext) {
		this.ctx = ctx;
	}

	private _lastTx: Transaction;
	private static _currentTx: Transaction;

	private static set currentTx(value: Transaction) {
		if (value !== Transaction._currentTx) {
			value._lastTx = Transaction._currentTx;
			this._currentTx = value;
		}
	}

	private actions: RecordAction[] = [];
	get outputs() {
		return this.actions;
	}

	update<T>(action: () => T): T {
		Transaction.currentTx = this;
		try {
			return action();
		} finally {
			Transaction._currentTx = Transaction._currentTx?._lastTx;
		}
	}

	static _record(type: Records, target: string, args: any[]) {
		if (!Transaction._currentTx) {
			throw new Error("Links can only be updated inside a Transaction");
		}
		Transaction._currentTx.actions.push({ type, target, args });
	}

	/**
	 * When Transactions are nested, call this to propagate changes up to the parent Transaction
	 */
	apply() {
		if (this._lastTx) {
			this._lastTx.actions.push(...this.actions);
			this.actions = [];
		}
	}

	async publish(opts: { pay?: boolean; sign?: boolean } = { pay: true, sign: true }) {
		const script = this.createScript();
		const utxos = this.ctx.api.getUnspentUtxos(this.ctx.wallet.address.toString());
		console.log(utxos);

		const txOut = TxOut.fromProperties(new Bn(2e8), this.ctx.wallet.address.toTxOutScript());
		const txHashBuf = deps.Buffer.alloc(32).fill(0);

		const tx = new TxBuilder()
			.setFeePerKbNum(0.0001e8)
			.setChangeAddress(this.ctx.wallet.address)
			.inputFromPubKeyHash(txHashBuf, 0, txOut, this.ctx.wallet.publicKey)
			.outputToAddress(new Bn(1e8), this.ctx.wallet.address)
			.build();

		const raw = tx.tx.toHex();
		console.log(raw);
	}

	private createScript() {
		const script = Script.fromSafeData(Buffer.from(JSON.stringify(this.actions)));
		return script;
	}
}

export enum Records {
	NEW = "NEW",
	CALL = "CALL"
}

type RecordAction = {
	type: Records;
	target: string;
	args: any[];
};
