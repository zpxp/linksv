import * as bsv from "bsv";
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

	publish(){
		const btx = new bsv.Tx();
		btx.addOutput(new bsv.Tx.Output({}))
	}
}

export enum Records {
	CTOR = "CTOR",
	CALL = "CALL"
}

type RecordAction = {
	type: Records;
	target: string;
	args: any[];
};
