import { Group, LinkContext, LinkSv, Link } from ".";
import { ILink, ILinkClass } from "./Link";
import { Constants, SigHash } from "./Constants";
import { getUnderlying, proxyInstance } from "./InstanceProxy";
import { Utxo } from "./IApiProvider";
import { decodeChainBuffer, deepCopy, LinkRef } from "./Utils";
import * as bsv from "bsv";
import { TxOut, Bn, PubKey, Address, Script, TxIn, Tx, KeyPair } from "bsv";
import { ProviderData } from "./ILinkProvider";

export class LinkTransaction {
	get ctx(): LinkContext {
		return LinkContext.activeContext;
	}
	private txb: bsv.TxBuilder;
	readonly external: boolean;
	private lockTx: boolean;
	private _lastTx: LinkTransaction;
	private additionalOutputs: Array<{ toAddrStr: string; satoshis: number }> = [];
	private inputHashType: { [inLocation: string]: SigHash } = {};
	private defaultSigHashType: SigHash;

	constructor();
	/**
	 * Import value from `export()`. call `await ctx.import(...)` instead of this
	 * @param txExport
	 */
	constructor(txExport: bsv.TxBuilderLike);
	/**
	 * Import raw tx hex export
	 * @param txHex Standard tx hex export
	 * @param linkReconstructor A function to reconstruct link prototypes. Return the correct link class based on the raw js object value.
	 */
	constructor(txHex: string, linkReconstructor?: (rawLink: object, input: TxIn) => Link);

	constructor(raw?: string | bsv.TxBuilderLike, linkReconstructor?: (rawLink: object, input: TxIn) => Link) {
		if (typeof raw === "string") {
			this.lockTx = true;
			this.external = true;
			this.txb = new bsv.TxBuilder(bsv.Tx.fromHex(raw));
			if (linkReconstructor) {
				const chunks = this.txb.tx.txOuts[0].script.chunks;
				const { json } = decodeChainBuffer(chunks, this.ctx);
				const chainRecord: ChainRecord = JSON.parse(json);
				for (let index = 0; index < chainRecord.o.length; index++) {
					const rawLink = chainRecord.o[index];
					const inputIdx = chainRecord.i?.[index] ?? index;
					const input = inputIdx >= 0 ? this.txb.tx.txIns[inputIdx] : null;
					const output = this.txb.tx.txOuts[index + 1];
					if (output) {
						if (isPublicKeyHashOut(output.script)) {
							rawLink.owner = Address.fromPubKeyHashBuf(output.script.chunks[2].buf).toString();
						} else if (isMultisigOut(output.script)) {
							const threshold = output.script.chunks[0].opCodeNum - 80;
							const keys = output.script.chunks
								.slice(1, output.script.chunks.length - 2)
								.map(x => bsv.PubKey.fromHex(x.buf.toString("hex")));
							rawLink.owner = new Group(keys, threshold);
						}
					}
					if (input) {
						rawLink.location = Buffer.from(input.txHashBuf).reverse().toString("hex") + "_" + input.txOutNum;
					}
					const link = (chainRecord.o[index] = linkReconstructor(rawLink, input));
					this._record(
						input ? LinkRecord.CALL : LinkRecord.NEW,
						"<import>",
						proxyInstance(link),
						deepCopy(link),
						deepCopy(link),
						[]
					);
					this.actions[this.actions.length - 1].outputIndex = index + 1;
				}
			}
		} else if (raw) {
			this.txb = bsv.TxBuilder.fromJSON(raw);
			this.actions = raw.recordActions || [];
			this.additionalOutputs = raw.additionalOutputs || [];
			this.lockTx = true;
			for (const action of this.actions) {
				// correct destruction
				getUnderlying(action.linkProxy).satoshis = action.satoshis;
			}
		} else {
			this.txb = new bsv.TxBuilder();
		}

		this.txb.setDust(0);
		if (this.ctx.satoshisPerByteFee) {
			this.txb.setFeePerKbNum(this.ctx.satoshisPerByteFee * 1000);
		}
	}

	private static _currentTx: LinkTransaction;

	private static setCurrentTx(value: LinkTransaction) {
		if (value === LinkTransaction._currentTx) {
			return false;
		}
		value._lastTx = LinkTransaction._currentTx;
		this._currentTx = value;
		return true;
	}

	public static getCurrentTx() {
		return this._currentTx;
	}

	private actions: RecordAction[] = [];

	get isLocked() {
		return this.lockTx;
	}

	get uTxOutMap() {
		return this.txb.uTxOutMap;
	}

	/**
	 * Tx id for this transaction. Populated after a successful `publish()`
	 */
	txid: string;

	get tx() {
		return this.txb.tx;
	}

	/**
	 * Link outputs
	 */
	get outputs() {
		const uniqueEndLinks = new Set<ILink>();
		for (const action of this.actions) {
			if (action.linkProxy && !action.linkProxy.isDestroyed) {
				uniqueEndLinks.add(action.linkProxy);
			}
		}
		return Array.from(uniqueEndLinks);
	}

	/**
	 * Link inputs
	 */
	get inputs() {
		const uniqueStartLinks = new Set<ILink>();
		for (const action of this.actions) {
			if (
				action.preActionSnapshot?.location &&
				!this.actions.some(x => x.linkProxy === action.linkProxy && x.type === LinkRecord.FORK)
			) {
				uniqueStartLinks.add(action.preActionSnapshot);
			}
		}
		return Array.from(uniqueStartLinks);
	}

	/**
	 * Link changes
	 */
	get txActions(): ReadonlyArray<RecordAction> {
		return this.actions.slice();
	}

	/**
	 * Make changes to any number of links and record them to this transaction
	 * @param action
	 * @returns
	 */
	update<T>(action: () => T): T {
		if (this.lockTx) {
			throw new Error("Transaction locked. Cannot update");
		}
		const shouldRemove = LinkTransaction.setCurrentTx(this);
		try {
			return action();
		} finally {
			if (shouldRemove) {
				LinkTransaction._currentTx = LinkTransaction._currentTx?._lastTx;
			}
		}
	}

	/**
	 * Deploy a template class, giving it an owner and requiring that owner to sign whenever new
	 * instances of that link are created.
	 * @param template The link class to deploy
	 * @param owner Owner address
	 */
	deploy(template: ILinkClass, owner: string) {
		if (!template.satoshis) {
			getUnderlying(template).satoshis = this.ctx.templateSatoshiValue;
		}
		if (template.satoshis === this.ctx.linkSatoshiValue) {
			throw new Error("Template satoshi value cannot equal satoshi value for links.");
		}
		getUnderlying(template).owner = owner;
		this.actions.push({
			type: LinkRecord.DEPLOY,
			target: template.name,
			args: [],
			inOwner: null,
			outOwner: owner,
			preActionSnapshot: null,
			postActionSnapshot: null,
			fromTemplate: null,
			linkProxy: template,
			satoshis: template.satoshis
		});
	}

	/**
	 * Rollback all changes is the current transaction for a given link
	 */
	static reset(link: Link) {
		if (!LinkTransaction._currentTx) {
			throw new Error("Links can only be reset inside a Transaction");
		}
		LinkTransaction._currentTx.reset(link);
	}

	/**
	 * Write to chain untracked template instances created with `static Template.constructUntracked = true`, and
	 * begin tracking their changes
	 * @param instance
	 * @returns
	 */
	track<T extends Link>(instance: T) {
		if ((instance as any)[Constants.IsProxy]) {
			// already tracked
			return instance;
		}

		instance.owner ||= this.ctx.owner.addressStr;
		if (instance.satoshis == undefined) {
			instance.satoshis = this.ctx.linkSatoshiValue;
		}
		instance.nonce = 0;
		const prox = proxyInstance(instance);
		const uniqueName = (prox as any)[Constants.TemplateName];
		this._record(LinkRecord.NEW, uniqueName, prox, null, deepCopy(instance), []);
		return prox;
	}

	/**
	 * Rollback all changes in this transaction for the given link
	 */
	reset(link: ILink) {
		if (this.lockTx) {
			throw new Error("Transaction locked, cannot reset link");
		}

		if (link instanceof Link) {
			const thisActions = this.actions.filter(x => x.linkProxy === link);
			if (thisActions.length && thisActions[0].type !== LinkRecord.NEW) {
				// revert its state
				(link as any)[Constants.SetState] = thisActions[0].preActionSnapshot;
			}
		}
		// clear those actions from the tx
		this.actions = this.actions.filter(x => x.linkProxy !== link);
	}

	/**
	 * When Transactions are nested, call this to propagate changes up to the parent Transaction
	 */
	apply() {
		const tx = this._lastTx || LinkTransaction._currentTx;
		if (tx) {
			if (tx.lockTx) {
				throw new Error("Parent transaction locked. Cannot apply");
			}
			tx.actions.push(...this.actions);
			for (const action of this.actions) {
				if (action.postActionSnapshot) {
					(action.linkProxy as any)[Constants.SetState] = Object.setPrototypeOf(
						action.postActionSnapshot,
						Object.getPrototypeOf(action.linkProxy)
					);
				}
			}
			this.actions = [];
		}
	}

	/**
	 * Copy changes from given transaction into this transaction
	 */
	applyFrom(tx: LinkTransaction) {
		this.actions.push(...tx.actions);
	}

	/**
	 * Include a P2PKH output in this transaction, sending the given amount of satoshis to the recipient address
	 * @param recipientAddress Address to send to
	 * @param satoshis Amount to send
	 */
	send(recipientAddress: string | Address, satoshis: number) {
		if (typeof recipientAddress !== "string") {
			recipientAddress = recipientAddress.toString();
		}
		this.additionalOutputs.push({ toAddrStr: recipientAddress, satoshis });
	}

	/**
	 * Sign all inputs that match the current LinkContext's owner and purse private keys
	 */
	sign() {
		if (!this.txb.tx.txOuts.length && !this.txb.txOuts.length && !this.actions.length) {
			throw new Error("No changes to sign");
		}
		// prevent any further modifications to this tx
		this.lockTx = true;
		this.txb.setDust(0);
		if (this.external) {
			// manual build
			const outs = this.txb.buildOutputs();
			this.txb.buildInputs(outs);
		} else {
			if (!this.txb.txIns.length) {
				// now inputs just build output. prob for arcane use
				this.txb.buildOutputs();
			} else if (!this.txb.tx.txOuts.length) {
				this.txb.build({ useAllInputs: true });
			}
		}
		this.txb.signWithKeyPairs([bsv.KeyPair.fromPrivKey(this.ctx.purse.privateKey), bsv.KeyPair.fromPrivKey(this.ctx.owner.privateKey)]);
	}

	/**
	 * Set the sig hash type for an unspent utxo that will be signed in this transaction. Used for payment channels.
	 * @see Use Cases https://wiki.bitcoinsv.io/index.php/SIGHASH_flags
	 * @param txid unspent utxo txid
	 * @param txidOutputIndex unspent utxo output index
	 * @param sigHash hash to sign with
	 */
	setInputSignatureHashType(txid: string, txidOutputIndex: number | string, sigHash: SigHash) {
		this.inputHashType[txid + "_" + txidOutputIndex] = sigHash;
	}

	/**
	 * Set default sig hash type used for all inputs not overridden with `setInputSignatureHashType()`, when `build()` is called
	 * @param sigHash
	 */
	setDefaultInputSignatureHashType(sigHash: SigHash) {
		this.defaultSigHashType = sigHash;
	}

	/**
	 * When importing a tx, you may need to provide sigs before signing
	 * @param inputTx tx being spent in this tx
	 * @param addressStr address of signer
	 * @param nHashType
	 */
	fillSigMap(inputTx: Tx, addressStr: string, nHashType?: number) {
		const inputTxid = inputTx.hash();
		const txIns = this.txb.tx.txIns.filter(x => x.txHashBuf.compare(inputTxid) === 0);
		if (!txIns.length) {
			throw new Error(`Txin for ${inputTxid.reverse().toString("hex")} not found`);
		}
		for (const txIn of txIns) {
			const sigs = this.txb.sigOperations.get(txIn.txHashBuf, txIn.txOutNum);
			if (!sigs.length) {
				this.txb.addSigOperation(txIn.txHashBuf, txIn.txOutNum, 0, "sig", addressStr, nHashType);
				this.txb.addSigOperation(txIn.txHashBuf, txIn.txOutNum, 1, "pubKey", addressStr);
			}
			if (!inputTx.txOuts[txIn.txOutNum]) {
				throw new Error(`Output not found at index ${txIn.txOutNum} for given input tx`);
			}
			this.txb.uTxOutMap.set(txIn.txHashBuf, txIn.txOutNum, inputTx.txOuts[txIn.txOutNum]);
		}
	}

	/**
	 * When importing a tx, you may need to provide sigs before signing
	 * @param inputIndex index of input utxo in this transaction
	 * @param addressStr address of signer
	 * @param nHashType
	 */
	fillSigMapFromIndex(inputIndex: number, addressStr: string, nHashType?: number) {
		const txIn = this.txb.tx.txIns[inputIndex];
		const inputTx = this.txb.uTxOutMap.get(txIn.txHashBuf, txIn.txOutNum);
		if (!inputTx) {
			throw new Error(`Input tx for ${Buffer.from(txIn.txHashBuf).reverse().toString("hex")} not found`);
		}
		const sigs = this.txb.sigOperations.get(txIn.txHashBuf, txIn.txOutNum);
		if (!sigs.length) {
			this.txb.addSigOperation(txIn.txHashBuf, txIn.txOutNum, 0, "sig", addressStr, nHashType);
			this.txb.addSigOperation(txIn.txHashBuf, txIn.txOutNum, 1, "pubKey", addressStr);
		}
	}

	/**
	 * Sync locations and nonces of all links in this transaction but keep their current state and changes.
	 * Arcane use only for if you need to force spend the latest link utxo recorded in the provider
	 */
	async syncLocations() {
		if (this.lockTx) {
			throw new Error("Transaction locked");
		}
		const uniqueLinks = new Map<Link, RecordAction[]>();
		for (const action of this.actions) {
			if (action.linkProxy instanceof Link) {
				uniqueLinks.set(
					action.linkProxy,
					this.actions.filter(x => x.linkProxy === action.linkProxy)
				);
			}
		}
		const links = Array.from(uniqueLinks);
		const locations = await this.ctx.provider.bulkGetLatestLocationForOrigin(links.map(x => x[0].origin));
		for (const [origin, latest] of Object.entries(locations)) {
			const [link, actions] = links.find(x => x[0].origin === origin);
			if (link) {
				const underlying = getUnderlying(link);
				underlying.location = latest.location;
				underlying.nonce = latest.nonce;

				for (const action of actions) {
					action.inputLocation = latest.location;
				}
			}
		}
	}

	/**
	 * Fork a link, meaning a new utxo output is created for it and its current location is ignored when creating the transaction.
	 * This is the equivalent of creating a new link with all the previous history of an existing link, regardless of if the current
	 * location has been spent or not. Because any previously spent link can be forked, all forked links are inherently untrustworthy
	 * when forking links that have deployed templates. For links without template owners, or if trust is not required, this issue is irrelevant.
	 * @param link
	 */
	fork(link: Link): void;
	/**
	 * Fork all given links
	 * @param links
	 */
	fork(links: Link[]): void;
	/**
	 * Fork all links present in this transaction
	 */
	fork(): void;
	fork(links?: Link | Link[]) {
		if (this.lockTx) {
			throw new Error("Transaction locked");
		}
		if (!links) {
			links = Array.from(
				new Set(this.actions.filter(x => x.linkProxy instanceof Link && !!x.linkProxy.location).map(x => x.linkProxy as Link))
			);
		}
		if (!Array.isArray(links)) {
			links = [links];
		}
		for (const link of links) {
			if (link.location) {
				const actions = this.actions.filter(x => x.linkProxy === link);
				this.actions = this.actions.filter(x => x.linkProxy !== link);
				const state = getUnderlying(link);
				// record the earliest state within this transaction
				const preState = actions.length ? actions[0].preActionSnapshot : null;
				state.forkOf = state.location;
				state.location = null;
				this._record(LinkRecord.FORK, "<fork>", link, preState, state, []);
			} else {
				this.actions = this.actions.filter(x => x.linkProxy !== link);
				// is new link, just copy it over
				this._record(LinkRecord.NEW, link[LinkSv.TemplateName], link, null, getUnderlying(link), []);
			}
		}
	}

	/**
	 * Returns true if all inputs for this transaction are signed
	 */
	isFullySigned() {
		const flags = bsv.Interp.SCRIPT_VERIFY_P2SH | bsv.Interp.SCRIPT_ENABLE_SIGHASH_FORKID | bsv.Interp.SCRIPT_VERIFY_NULLDUMMY;
		return bsv.TxVerifier.verify(this.txb.tx, this.txb.uTxOutMap, flags);
	}

	/**
	 * Export JSON of this current transaction. @see LinkTransaction.exportHex for raw hex export
	 * @param pubKeys Insert the sig pub keys on pending inputs that belong to any of these pub keys
	 */
	export(pubKeys?: PubKey[]) {
		if (pubKeys?.length) {
			const addressStrMap: { [s: string]: PubKey } = {};
			for (const pub of pubKeys) {
				const addressStr = Address.fromPubKey(pub).toString();
				addressStrMap[addressStr] = pub;
			}
			for (const txIn of this.txb.txIns) {
				for (const sigMap of this.txb.sigOperations.get(txIn.txHashBuf, txIn.txOutNum)) {
					const { nScriptChunk, type, addressStr, nHashType } = sigMap;
					if (type !== "pubKey") {
						continue;
					}
					const pub = addressStrMap[addressStr];
					if (!pub) {
						continue;
					}
					txIn.script.chunks[nScriptChunk] = new Script().writeBuffer(pub.toBuffer()).chunks[0];
					txIn.setScript(txIn.script);
					sigMap.log = "successfully inserted public key";
				}
			}
		}

		return this.ctx.serialize(this.toJSON());
	}

	/**
	 * Export changes for given link, or null if there is none
	 * @param link
	 */
	exportLink(link: Link) {
		const changes = this.actions.find(x => x.linkProxy === link);
		if (!changes) {
			return null;
		}
		const val = getUnderlying(changes.linkProxy);
		return Object.setPrototypeOf({ ...val, ["t~"]: changes.linkProxy[LinkSv.TemplateName] }, Object.getPrototypeOf(val));
	}

	toJSON() {
		const rtn = this.txb.toJSON();
		rtn.recordActions = this.actions.map((x, i) => ({
			...x,
			args: [],
			// this isnt required for import
			postActionSnapshot: null,
			// only record the original pre state for this link if it has more than one update. save json size
			preActionSnapshot: this.actions.findIndex(d => d.linkProxy === x.linkProxy) === i ? x.preActionSnapshot : undefined
		}));
		// add this so the deserializer client auto detects state changes in these links and updates to this current state
		rtn.currentLinkStates = Object.fromEntries(
			this.actions.map(x => {
				const val = getUnderlying(x.linkProxy);
				// serialize it as json with template name
				return [
					x.linkProxy.location,
					Object.setPrototypeOf({ ...val, ["t~"]: x.linkProxy[LinkSv.TemplateName] }, Object.getPrototypeOf(val))
				];
			})
		);
		rtn.additionalOutputs = this.additionalOutputs;
		return rtn;
	}

	/**
	 * Remove all changes from this tx without rolling back each link state
	 */
	clear(): void;
	/**
	 * Remove all changes from this tx for a specific link without rolling back that link's changes
	 */
	clear(link?: ILink): void;
	clear(link?: ILink) {
		if (link) {
			if (this.lockTx) {
				throw new Error("Transaction locked, cannot clear link");
			}

			// clear those actions from the tx
			this.actions = this.actions.filter(x => x.linkProxy !== link);
			if (link instanceof Link && link.forkOf && !link.location) {
				const state = getUnderlying(link);
				// reset location
				state.location = state.forkOf;
				state.forkOf = null;
			}
		} else {
			for (const action of this.actions) {
				const link = action.linkProxy;
				if (link instanceof Link && link.forkOf && !link.location) {
					const state = getUnderlying(link);
					// reset location
					state.location = state.forkOf;
					state.forkOf = null;
				}
			}
			this.txb = new bsv.TxBuilder();
			this.inputHashType = {};
			this.defaultSigHashType = undefined;
			this.lockTx = false;
			this.actions = [];
			this.additionalOutputs = [];
		}
	}

	/**
	 * Rollback all changes recorded in the tx
	 */
	rollback() {
		this.txb = new bsv.TxBuilder();
		this.lockTx = false;
		for (let i = this.actions.length - 1; i >= 0; i--) {
			const action = this.actions[i];
			if (!action.preActionSnapshot && action.linkProxy instanceof Link) {
				// clear from store
				this.ctx.store.remove(action.linkProxy);
			}
			(action.linkProxy as any)[Constants.SetState] = action.preActionSnapshot;
		}
		this.inputHashType = {};
		this.defaultSigHashType = undefined;
		this.actions = [];
		this.additionalOutputs = [];
	}

	/**
	 * Return the estimated fee in satoshis
	 */
	getEstimatedFee() {
		if (!this.lockTx) {
			throw new Error("LinkTransaction must be built before estimating fee. Call tx.build()");
		}

		const totalInputs = Array.from(this.txb.uTxOutMap.map)
			.map(([txid, input]) => input)
			.reduce((prev, next) => prev.add(next.valueBn), new Bn());
		const totalOutput = this.txb.txOuts.reduce((prev, next) => prev.add(next.valueBn), new Bn());
		const inputOutputDifference = totalOutput.sub(totalInputs);
		// include output difference in payment calculation
		return Math.ceil(this.txb.estimateFee(inputOutputDifference.gt(0) ? inputOutputDifference : undefined).toNumber());
	}

	/**
	 * Pay with unspent utxos from the current context's purse address
	 * @param payWith Spend these utxos first
	 * @param payFromAddress Spend utxos from this address. Will require their signature
	 * @param force Ignore estimated fee and build anyway. Will still fail on publish if you have insufficient funds
	 */
	async pay(opts?: { payWith?: Utxo[]; payFromAddress?: string; force?: boolean }) {
		if (!this.txb.txOuts.length) {
			await this.build();
		}

		const totalInputs = Array.from(this.txb.uTxOutMap.map)
			.map(([txid, input]) => input)
			.reduce((prev, next) => prev.add(next.valueBn), new Bn());
		const totalOutput = this.txb.txOuts.reduce((prev, next) => prev.add(next.valueBn), new Bn());
		const inputOutputDifference = totalOutput.sub(totalInputs);
		// include output difference in payment calculation
		let estimatedFee = Math.ceil(this.txb.estimateFee(inputOutputDifference.gt(0) ? inputOutputDifference : undefined).toNumber());
		let lastInputFee = estimatedFee;

		const payAddress = opts?.payFromAddress ? Address.fromString(opts.payFromAddress) : this.ctx.purse.address;
		const payAddressStr = payAddress.toString();
		this.txb.setChangeAddress(payAddress);

		async function* getUtxos(ctx: LinkContext): AsyncGenerator<Utxo[], []> {
			if (opts?.payWith) {
				// pay with overriden utxos
				yield opts.payWith;
			}
			// then get local stored utxos
			const local = await ctx.utxoStore.getUnspent(payAddressStr, estimatedFee);
			// delete all for address incase something goes wrong
			// we dont want stale caches
			await ctx.utxoStore.removeAll(payAddressStr);
			yield local;
			//then get utxos from miner api
			yield await ctx.api.getUnspentUtxos(payAddressStr);
			if (!opts?.force) {
				throw new Error(`Not enough funds. Needed ${estimatedFee} more satoshis`);
			}
			return [];
		}

		const fetchUtxos = getUtxos(this.ctx);
		let paid = false;
		let utxos: Utxo[];
		const addedInputs: Set<string> = new Set();
		do {
			utxos = (await fetchUtxos.next()).value;

			let utxo: Utxo;
			while (((utxo = utxos.shift()), utxo)) {
				// dont spend our link utxos
				if (this.isValidPurseUtxo(utxo)) {
					const location = utxo.tx_hash + "_" + utxo.tx_pos;
					if (addedInputs.has(location)) {
						// dont add it twice
						continue;
					}
					const outputScript = bsv.Script.fromPubKeyHash(payAddress.hashBuf);
					this.txb.inputFromPubKeyHash(
						Buffer.from(utxo.tx_hash, "hex").reverse(),
						utxo.tx_pos,
						bsv.TxOut.fromProperties(new Bn(utxo.value), outputScript),
						undefined,
						undefined,
						this.inputHashType[location] || this.defaultSigHashType
					);
					addedInputs.add(location);
					this.ctx.logger?.log(`Input payment utxo ${utxo.tx_hash} ${utxo.tx_pos} ${utxo.value}`);
					const newFee = Math.ceil(
						this.txb.estimateFee(inputOutputDifference.gt(0) ? inputOutputDifference : undefined).toNumber()
					);
					// accomadate for adding extra input
					// get diff between last input and current one
					const diff = newFee - lastInputFee;
					lastInputFee = newFee;
					estimatedFee -= utxo.value - diff;
				}
				if (estimatedFee < 0) {
					// enough inputs
					paid = true;
					break;
				}
			}
		} while (!paid);

		if (utxos.length && !opts?.payWith?.length && payAddressStr === this.ctx.purse.address.toString()) {
			// save the remaining utxos
			await this.ctx.utxoStore.setUnspent(this.ctx.purse.addressStr, utxos);
		}
	}

	/**
	 * Ensure utxo is not a link and we can spend it
	 * @param utxo
	 * @returns
	 */
	isValidPurseUtxo(utxo: Utxo) {
		// make sure we dont spend our link utxos
		return this.ctx.dontSpendUtxosWithValueLessThan
			? utxo.value > this.ctx.dontSpendUtxosWithValueLessThan
			: this.ctx.purse.addressStr === this.ctx.owner.addressStr
			? utxo.value > this.ctx.linkSatoshiValue
			: utxo.value > 0;
	}

	/** Build and lock the current transaction */
	async build() {
		this.lockTx = true;
		if (this.external) {
			return;
		}
		if (this.txb.txOuts.length) {
			this.txb = new bsv.TxBuilder();
		}
		this.txb.setDust(0);
		if (this.ctx.satoshisPerByteFee) {
			this.txb.setFeePerKbNum(this.ctx.satoshisPerByteFee * 1000);
		}

		const cosigOutputs: Array<{ toAddrStr: string | Group; satoshis: number }> = [];
		const uniqueEndLinks = new Map<ILink, RecordAction[]>();
		const uniqueStartLinks = new Map<ILink, RecordAction[]>();
		// const uniqueCreates = new Set<ITemplateClass>();
		for (const action of this.actions) {
			checkUntrackedLink(action, this.ctx);
			uniqueEndLinks.set(
				action.linkProxy,
				this.actions.filter(x => x.linkProxy === action.linkProxy)
			);
			if (!this.actions.some(x => x.linkProxy === action.linkProxy && x.type === LinkRecord.FORK)) {
				// is input if has no forks
				uniqueStartLinks.set(
					this.actions.find(x => x.linkProxy === action.linkProxy).preActionSnapshot || action.linkProxy,
					this.actions.filter(x => x.linkProxy === action.linkProxy)
				);
			}
		}

		/*

		input utxo format is per index:
		[N]?: link inputs
		[N..M]?: template cosigs
		[P + 1]: purse input utxo

 		*/

		const pendingCosigInputs: Array<{ owner: string; location: string; satoshis: number }> = [];
		const startLocations: string[] = [];
		const mandatorySigsRequired: string[] = [];
		// write each action utxos inputs
		for (const [link, actions] of Array.from(uniqueStartLinks)) {
			if (!link?.location) {
				const hasFork = actions.some(x => x.type === LinkRecord.FORK);
				const hasNew = actions.some(x => x.type === LinkRecord.NEW);
				const hasDeploy = actions.some(x => x.type === LinkRecord.DEPLOY);
				if (!hasNew && !hasDeploy && !hasFork) {
					throw new Error(
						`Link does not have a location and it wasn't created in this transaction ${link.owner} ${actions[0].target} ${link}`
					);
				}
				const template = link.constructor as ILinkClass;
				if (hasNew && link instanceof Link && template.owner) {
					// get template owner and sign this creation so it is legit
					if (template.owner !== link.owner) {
						if ((template.owner as any) instanceof Group) {
							throw new Error("A template cannot be owned by a group");
						}
						if (mandatorySigsRequired.includes(template.owner)) {
							// they already have to sign this tx. ignore any further template utxos
							continue;
						}
						// get a unspent utxo from the owner address
						const ownerUtxos = await this.ctx.api.getUnspentUtxos(template.owner);
						const [locationHash, locationOutput] = template.location ? template.location.split("_", 2) : [null, "NaN"];
						const utxo = ownerUtxos.find(
							x => x.value === template.satoshis || (x.tx_hash === locationHash && x.tx_pos === parseInt(locationOutput, 10))
						);
						if (!utxo) {
							throw new Error(`Cannot find utxo for template ${link[LinkSv.TemplateName]} owner ${template.owner}`);
						}

						mandatorySigsRequired.push(template.owner);
						// spend the utxo back to the same owner address to make them sign
						pendingCosigInputs.push({
							owner: template.owner,
							location: `${utxo.tx_hash}_${utxo.tx_pos}`,
							satoshis: template.satoshis
						});
						cosigOutputs.push({ toAddrStr: template.owner, satoshis: template.satoshis });
					}
				}
				continue;
			}
			// get a utxo input from the link owner so the utxo chain for this token instance
			// state is legit
			if (link.location && link.owner && !link.isDestroyed) {
				startLocations.push(link.location);
				// set the first action input location
				actions[0].inputLocation = link.location;
				if (typeof link.owner === "string") {
					mandatorySigsRequired.push(link.owner);
				}
				this.addInput(link.location, link.owner, link.satoshis);
			}
		}

		let txOutputIndex = 1; // +1 for script as first output
		const pendingOutputs: Array<{ toAddrStr: string | Group; satoshis: number }> = [];
		const outputScript = [];
		const destroyedLinks = [];
		// write each action utxos outputs
		for (const [link, actions] of Array.from(uniqueEndLinks)) {
			if (link.isDestroyed) {
				destroyedLinks.push(link);
			} else {
				outputScript.push(link);
				if (!link.owner) {
					throw new Error(`Link does not have an owner ${link.location}`);
				}
				const satLimit =
					this.ctx.dontSpendUtxosWithValueLessThan ||
					(link instanceof Link ? this.ctx.linkSatoshiValue : this.ctx.templateSatoshiValue);
				if (link.satoshis < satLimit && this.ctx.owner.addressStr === this.ctx.purse.addressStr) {
					throw new Error(
						`Cannot create a link with satoshis less than ${satLimit} while your purse private key matches your owner private key. ${link}`
					);
				}
				pendingOutputs.push({ toAddrStr: link.owner, satoshis: link.satoshis });
				for (const action of this.actions.filter(x => x.linkProxy === link)) {
					action.outputIndex = txOutputIndex;
				}
				txOutputIndex++;
			}
		}

		// make sure these inputs are added after any link inputs
		for (const cosigInput of pendingCosigInputs) {
			this.addInput(cosigInput.location, cosigInput.owner, cosigInput.satoshis);
		}

		/*

		output utxo format is per index:
		[0]: script
		[1..N]?: link outputs
		[N..M]?: template cosigs
		[M..P]?: additional outputs, such as P2PKH
		[P + 1]: change utxo

 		*/

		// now record the outputs in order
		const script = await this.createScript(startLocations, outputScript, destroyedLinks);
		this.txb.outputToScript(new Bn(0), script);

		for (const outp of pendingOutputs) {
			this.addOutput(outp.toAddrStr, outp.satoshis);
		}
		for (const outp of cosigOutputs) {
			this.addOutput(outp.toAddrStr, outp.satoshis);
		}
		for (const outp of this.additionalOutputs) {
			this.addOutput(outp.toAddrStr, outp.satoshis);
		}
	}

	/**
	 * Publish current transaction changes. Signs and pays if they are still pending.
	 * @param opts
	 * @returns tx id
	 */
	async publish(opts: { pay?: boolean; sign?: boolean; payWith?: Utxo[] } = { pay: true, sign: true }) {
		if (opts.payWith) {
			opts.pay = true;
		}

		if (!this.lockTx) {
			await this.build();
		}

		if (opts.pay) {
			await this.pay(opts);
		}

		if (opts.sign || opts.pay) {
			await this.sign();
		}

		if (this.isFullySigned() || (!opts.pay && this.tx?.txIns.length === 0)) {
			// run pre checks
			for (const action of this.actions) {
				if (!action.linkProxy.isDestroyed && !action.outputIndex) {
					throw new Error(
						`Output index invalid ${action.outputIndex} ${(action.linkProxy as any)[Constants.TemplateName]} ${
							action.linkProxy
						}`
					);
				}
			}
			this.ctx.logger?.log(
				"Inputs " +
					this.actions
						.map(x => x.inputLocation)
						.filter(x => !!x)
						.join(" ")
			);
			const uniqueLinks = new Map(this.actions.map(x => [x.linkProxy, this.actions.filter(f => f.linkProxy === x.linkProxy)]));
			const updateMap = new Map<string, ProviderData>();

			const raw = this.txb.tx.toHex();
			const txid = await this.ctx.api.broadcast(raw, Array.from(uniqueLinks), this.external, this.txb.tx.txIns.length, this.txb.tx.txOuts.length);
			this.txid = txid;

			try {
				// write location
				for (const [link, actions] of uniqueLinks) {
					// write the last change to provider
					const action = actions[actions.length - 1];
					if (!action.linkProxy.isDestroyed) {
						const underlying = getUnderlying(action.linkProxy);
						underlying.location = `${txid}_${action.outputIndex}`;
						if (!this.external) {
							underlying.nonce++;
						}
						// if the first action was new or deploy we need to set origin
						if (actions[0].type === LinkRecord.NEW || actions[0].type === LinkRecord.DEPLOY) {
							(underlying as Link).origin = `${txid}_${action.outputIndex}`;
						}
						if (underlying instanceof Link) {
							updateMap.set(underlying.origin, {
								location: underlying.location,
								forkOf: underlying.forkOf,
								nonce: underlying.nonce,
								linkName: link[LinkSv.TemplateName],
								owners:
									link.owner instanceof Group
										? link.owner.pubKeys.map(x => bsv.Address.fromPubKey(x).toString())
										: [link.owner],
								origin: underlying.origin,
								destroyingTxid: undefined
							});
							// clear this as it is now written to chain and we have a new nonce
							underlying.forkOf = undefined;
						}
					} else if (action.linkProxy instanceof Link) {
						// tell provider it is destroyed linkProxy state may be null
						const link = getUnderlying(action.linkProxy);
						if (link) {
							link.location = `${txid}_0`;
							if (!this.external) {
								link.nonce++;
							}
							updateMap.set(link.origin, {
								location: link.location,
								nonce: link.nonce,
								forkOf: undefined,
								linkName: action.linkProxy[LinkSv.TemplateName],
								owners:
									link.owner instanceof Group
										? link.owner.pubKeys.map(x => bsv.Address.fromPubKey(x).toString())
										: link.owner
										? [link.owner]
										: [],
								origin: link.origin,
								// it was destroyed in this tx
								destroyingTxid: txid
							});
						}
					}
					action.linkProxy[LinkSv.HasChanges] = false;
				}
				// write location in the provider store
				await this.ctx.updateProvider(Array.from(updateMap).map(([origin, x]) => x));
			} catch (e) {
				this.ctx.logger?.error(`Updating provider failed. Utxos may be broken now. `, updateMap, e);
			}

			// save change utxo
			const changeUtxo = this.txb.tx.txOuts
				.filter(x => {
					if (isPublicKeyHashOut(x.script)) {
						const address = bsv.Address.fromPubKeyHashBuf(x.script.chunks[2].buf);
						if (address instanceof bsv.Address) {
							return x.valueBn.gt(this.ctx.linkSatoshiValue) && address.toString() === this.ctx.purse.addressStr;
						}
					}
					return false;
				})
				.map<Utxo>(x => ({ tx_hash: txid, tx_pos: this.txb.tx.txOuts.indexOf(x), value: x.valueBn.toNumber() }));

			if (changeUtxo.length) {
				await this.ctx.utxoStore.setUnspent(this.ctx.purse.addressStr, changeUtxo);
			}

			return txid;
		} else {
			throw new Error("Cannot publish, not fully signed");
		}
	}

	/**
	 * Export raw tx hex
	 * @param pubKeys Insert the sig pub keys on pending inputs that belong to any of these pub keys
	 * @returns
	 */
	exportHex(pubKeys?: PubKey[]) {
		if (pubKeys?.length) {
			const addressStrMap: { [s: string]: PubKey } = {};
			for (const pub of pubKeys) {
				const addressStr = Address.fromPubKey(pub).toString();
				addressStrMap[addressStr] = pub;
			}
			for (const txIn of this.txb.txIns) {
				for (const sigMap of this.txb.sigOperations.get(txIn.txHashBuf, txIn.txOutNum)) {
					const { nScriptChunk, type, addressStr, nHashType } = sigMap;
					if (type !== "pubKey") {
						continue;
					}
					const pub = addressStrMap[addressStr];
					if (!pub) {
						continue;
					}
					txIn.script.chunks[nScriptChunk] = new Script().writeBuffer(pub.toBuffer()).chunks[0];
					txIn.setScript(txIn.script);
					sigMap.log = "successfully inserted public key";
				}
			}
		}
		const raw = this.txb.tx.toHex();
		return raw;
	}

	/**
	 * When importing a transaction from a tx hex, we need to set the input txs if we want to sign and publish
	 * @param inputTxs Txs that belong to the imported input utxos
	 */
	importTxMap(inputTxs: Tx[]) {
		for (const tx of inputTxs) {
			this.txb.uTxOutMap.setTx(tx);
		}
	}

	/**
	 * When importing a transaction from a tx hex, we need to set the input txs if we want to sign and publish
	 * Iterate all inputs and load their txs
	 */
	async importTxMapFromApi() {
		const result = await this.ctx.api.getBulkTx(this.txb.tx.txIns.map(x => Buffer.from(x.txHashBuf).reverse().toString("hex")));
		for (const [txid, tx] of Object.entries(result)) {
			this.txb.uTxOutMap.setTx(tx);
		}
	}

	private addInput(inLocation: string, fromAddr: string | Group, satoshis: number) {
		const [location, currentOutputIndex] = inLocation.split("_", 2);
		const outIdx = parseInt(currentOutputIndex, 10);
		if (isNaN(outIdx)) {
			throw new Error(`Invalid location cannot add as input. ${inLocation}`);
		}
		// get its current location utxo and add to tx
		if (typeof fromAddr === "string") {
			const outputScript = bsv.Script.fromPubKeyHash(bsv.Address.fromString(fromAddr).hashBuf);
			this.txb.inputFromPubKeyHash(
				Buffer.from(location, "hex").reverse(),
				outIdx,
				TxOut.fromProperties(new Bn(satoshis), outputScript),
				undefined,
				undefined,
				this.inputHashType[inLocation] || this.defaultSigHashType
			);
		} else {
			const txHash = Buffer.from(location, "hex").reverse();
			const { outputScript, inputScript } = this.createMultisigInput(txHash, outIdx, fromAddr.required, fromAddr.pubKeys);
			this.txb.inputFromScript(txHash, outIdx, TxOut.fromProperties(new Bn(satoshis), outputScript), inputScript);
		}
	}

	private createMultisigInput(txHash: Buffer, outIdx: number, required: number, pubKeys: PubKey[]) {
		const sortedKeys = bsv.Script.sortPubKeys(pubKeys);
		const inputScript = new bsv.Script();
		const outputScript = new bsv.Script();
		outputScript.writeOpCode(required + bsv.OpCode.OP_1 - 1);
		for (let index = 0; index < sortedKeys.length; index++) {
			const key = sortedKeys[index];
			outputScript.writeBuffer(key.toBuffer());
			this.txb.addSigOperation(txHash, outIdx, 1, "sig", bsv.Address.fromPubKey(key).toString());
		}
		outputScript.writeOpCode(pubKeys.length + bsv.OpCode.OP_1 - 1);
		outputScript.writeOpCode(bsv.OpCode.OP_CHECKMULTISIG);
		return { inputScript, outputScript };
	}

	private addOutput(toAddr: string | Group, satoshis: number) {
		if (typeof toAddr === "string") {
			this.txb.outputToAddress(new Bn(satoshis), bsv.Address.fromString(toAddr));
		} else {
			const multisig = bsv.Script.fromPubKeys(toAddr.required, toAddr.pubKeys);
			this.txb.outputToScript(new Bn(satoshis), multisig);
		}
	}

	private async createScript(startLocations: string[], uniqueEnds: ILink[], destroyedLinks: ILink[]) {
		const record: ChainRecord = {
			i:
				startLocations.length === uniqueEnds.length && !destroyedLinks.length
					? undefined
					: uniqueEnds.map(x => {
							return startLocations.indexOf(x.location);
					  }),
			o: uniqueEnds.map(x => {
				const inst = getUnderlying(x);
				// increment nonce for the script but dont change the instance just yet
				return Object.setPrototypeOf({ ...inst, nonce: inst.nonce + 1 }, Object.getPrototypeOf(inst));
			}),
			d: destroyedLinks.length ? destroyedLinks.map(x => startLocations.indexOf(x.location)) : undefined
		};

		if (record.i && !record.i.length) {
			record.i = undefined;
		}

		const files: (File | Buffer)[] = [];

		const json = JSON.stringify(record, (key, val) => {
			if (val instanceof Link && val[LinkSv.IsProxy]) {
				if (val.isDestroyed) {
					return undefined;
				}
				// object in this tx
				const action = this.actions.find(x => x.linkProxy === val);
				if (action) {
					if (!action.outputIndex) {
						throw new Error(`No output index for ${val[LinkSv.TemplateName]} ${val}`);
					}
					const rtn: LinkRef = {
						$: "_" + action.outputIndex,
						t: val[LinkSv.TemplateName]
					};
					return rtn;
				} else if (val.location) {
					const rtn: LinkRef = {
						$: val.location,
						t: val[LinkSv.TemplateName]
					};
					return rtn;
				}
				throw new Error(
					`Cannot serialize link, no location found, and not part of current transaction. ${val.origin} ${val.location} ${val.owner}`
				);
			}
			if (val && val.constructor && val.constructor[Constants.ChainClass]) {
				val = Object.setPrototypeOf({ ...val, ["~"]: val.constructor[Constants.ChainClass] }, Object.getPrototypeOf(val));
			}
			if (this.ctx.serializeTransformer) {
				val = this.ctx.serializeTransformer(key, val);
			}
			if (typeof File !== "undefined" && val instanceof File) {
				files.push(val);
				val = { $file: files.length - 1, name: val.name, type: val.type };
			} else if (Buffer.isBuffer(val)) {
				files.push(val);
				val = { $buf: files.length - 1 };
			} else if (val && typeof val === "object" && val.type === "Buffer" && "data" in val) {
				files.push(Buffer.from(val.data));
				val = { $buf: files.length - 1 };
			}
			if (val === null) {
				return undefined;
			}
			if (val !== val) {
				return "NaN";
			}
			if (val === Infinity) {
				return "Infinity";
			}
			if (val === -Infinity) {
				return "-Infinity";
			}
			if (val instanceof Link) {
				if (val.isDestroyed) {
					throw new Error(`Tried to record a destroyed link to chain. ${val.location} ${key} ${val}`);
				}
				if (!(val as any)[Constants.HasProxy]) {
					throw new Error(
						`Tried to record an untracked link to chain, it was likely created with constructUntracked. ${key} ${val}`
					);
				}
				val = { ...val };
				for (const prop of EXCLUDE_PROPS) {
					delete val[prop];
				}
			}
			if (typeof val === "function") {
				throw new Error(`Cannot serialize function value to chain. Prop: ${key}`);
			}
			return val;
		});

		const fileBufs = await Promise.all(files.map(x => (Buffer.isBuffer(x) ? x : blobToArrayBuffer(x))));
		const bufs = [Buffer.from(json), ...fileBufs.map(x => Buffer.from(x))];
		const data = LinkContext.activeContext.compression.compress(Buffer.concat(bufs));
		const script = new bsv.Script();
		script.writeOpCode(bsv.OpCode.OP_FALSE);
		script.writeOpCode(bsv.OpCode.OP_RETURN);
		if (LinkContext.activeContext.app) {
			script.writeBuffer(Buffer.from(LinkContext.activeContext.app));
		}
		if (fileBufs.length) {
			// write offset header
			script.writeBuffer(Buffer.from(JSON.stringify(bufs.map(x => x.length))));
		}
		script.writeBuffer(data);
		return script;
	}

	/**
	 * Record an action to the tx
	 * @param type action type
	 * @param target target unique name
	 * @param proxy wrapper proxy object (public object api)
	 * @param preState underlying object pre action (deep cloned)
	 * @param postState underlying object post action (deep cloned)
	 * @param args action args (function call etc)
	 */
	static _record(type: LinkRecord, target: string, proxy: ILink, preState: ILink, postState: ILink, args: any[]) {
		if (!LinkTransaction._currentTx) {
			throw new Error("Links can only be updated inside a Transaction");
		}
		LinkTransaction._currentTx._record(type, target, proxy, preState, postState, args);
	}

	_record(type: LinkRecord, target: string, proxy: ILink, preState: ILink, postState: ILink, args: any[]) {
		this.actions.push({
			type,
			target,
			args,
			outOwner: proxy.owner,
			inOwner: proxy.owner,
			preActionSnapshot: preState,
			postActionSnapshot: postState,
			fromTemplate: proxy[LinkSv.TemplateName],
			linkProxy: proxy,
			satoshis: proxy.satoshis
		});
		if (type === LinkRecord.NEW) {
			// track the instance
			this.ctx.addInstance(proxy as Link);
		}
		proxy[LinkSv.HasChanges] = true;
	}
}

export enum LinkRecord {
	NEW = "NEW",
	FORK = "FORK",
	DEPLOY = "DEPLOY",
	CALL = "CALL"
}

export type RecordAction = {
	type: LinkRecord;
	target: string;
	preActionSnapshot: ILink;
	postActionSnapshot: ILink;
	linkProxy: ILink;
	fromTemplate: string;
	inOwner: string | Group;
	satoshis: number;
	outOwner: string | Group;
	args: any[];
	outputIndex?: number;
	inputLocation?: string;
};

const EXCLUDE_PROPS = ["owner", "location", "satoshis"];

export type ChainRecord = {
	/** input indx map when number of states does not equal number of inputs, creating/deleting */
	i?: number[];
	/** output states */
	o: ILink[];
	/** index of input utxos that are destroyed in this tx */
	d?: number[];
};

function isPublicKeyHashOut(script: bsv.Script) {
	return !!(
		script.chunks.length === 5 &&
		script.chunks[0].opCodeNum === bsv.OpCode.OP_DUP &&
		script.chunks[1].opCodeNum === bsv.OpCode.OP_HASH160 &&
		script.chunks[2].buf &&
		script.chunks[2].buf.length === 20 &&
		script.chunks[3].opCodeNum === bsv.OpCode.OP_EQUALVERIFY &&
		script.chunks[4].opCodeNum === bsv.OpCode.OP_CHECKSIG
	);
}

function isMultisigOut(script: bsv.Script) {
	return !!(
		script.chunks.length > 3 &&
		(script.chunks[script.chunks.length - 1].opCodeNum === bsv.OpCode.OP_CHECKMULTISIG ||
			script.chunks[script.chunks.length - 1].opCodeNum === bsv.OpCode.OP_CHECKMULTISIGVERIFY)
	);
}

function checkUntrackedLink(action: RecordAction, ctx: LinkContext) {
	if (!action.linkProxy[LinkSv.IsProxy] && action.linkProxy instanceof Link) {
		if (action.type !== LinkRecord.NEW) {
			throw new Error(
				`Unknown link found in actions that is not wrapped in a proxy. Did you forget to track it? ${action.linkProxy}`
			);
		}
		const instance = action.linkProxy;
		if (!instance.owner) {
			throw new Error("Untracked link does not have an owner " + instance);
		}
		if (instance.satoshis == undefined) {
			instance.satoshis = ctx.linkSatoshiValue;
		}
		instance.nonce = 0;
		action.linkProxy = proxyInstance(instance);
	}
}

async function blobToArrayBuffer(blob: Blob) {
	if ("arrayBuffer" in blob) {
		return await blob.arrayBuffer();
	}

	return new Promise<ArrayBuffer>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as ArrayBuffer);
		reader.onerror = () => reject;
		reader.readAsArrayBuffer(blob);
	});
}
