import { Group, LinkContext, LinkSv, Link } from ".";
import { ILink, ILinkClass, LINK_DUST } from "./Link";
import { Constants } from "./Constants";
import { getUnderlying, proxyInstance } from "./InstanceProxy";
import { Utxo } from "./IApiProvider";
import { deepCopy, LinkRef } from "./Utils";
import * as bsv from "bsv";
import { TxOut, Bn, PubKey, OpCode, Address } from "bsv";
import "./Fixes";

export class LinkTransaction {
	get ctx(): LinkContext {
		return LinkContext.activeContext;
	}
	private txb: bsv.TxBuilder;
	private lockTx: boolean;
	private _lastTx: LinkTransaction;

	constructor(raw?: string | bsv.TxBuilderLike) {
		if (typeof raw === "string") {
			this.txb = new bsv.TxBuilder(bsv.Tx.fromHex(raw));
			this.lockTx = true;
		} else if (raw) {
			this.txb = bsv.TxBuilder.fromJSON(raw);
			this.actions = raw.recordActions || [];
			this.lockTx = true;
			for (const action of this.actions) {
				if (!action.linkProxy.isDestroyed && action.type === LinkRecord.CALL && action.target === "destroy") {
					// correct destruction
					getUnderlying(action.linkProxy).satoshis = 0;
				}
			}
		} else {
			this.txb = new bsv.TxBuilder();
		}
	}

	private static _currentTx: LinkTransaction;

	private static set currentTx(value: LinkTransaction) {
		value._lastTx = LinkTransaction._currentTx;
		this._currentTx = value;
	}

	public static getCurrentTx() {
		return this._currentTx;
	}

	private actions: RecordAction[] = [];

	get isLocked() {
		return this.lockTx;
	}

	/**
	 * Tx id for this transaction. Populated after a successful `publish()`
	 */
	txid: string;

	/**
	 * Link outputs
	 */
	get outputs() {
		const uniqueEndLinks = new Set<ILink>();
		for (const action of this.actions) {
			if (!action.linkProxy.isDestroyed) {
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
			if (action.preActionSnapshot?.location) {
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
		LinkTransaction.currentTx = this;
		try {
			return action();
		} finally {
			LinkTransaction._currentTx = LinkTransaction._currentTx?._lastTx;
		}
	}

	/**
	 * Deploy a template class, giving it an owner and requiring that owner to sign whenever new
	 * instances of that link are created.
	 * @param template The link class to deploy
	 * @param owner Owner address
	 */
	deploy(template: ILinkClass, owner: string) {
		getUnderlying(template).satoshis = this.ctx.linkSatoshiValue;
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
			linkProxy: template
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
		this._record(LinkRecord.NEW, uniqueName, prox, null, deepCopy(instance), instance.constructor as ILinkClass, []);
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
	 * Sign all inputs that match the current LinkContext's owner and purse private keys
	 */
	sign() {
		if (!this.txb.tx.txOuts.length && !this.txb.txOuts.length && !this.actions.length) {
			throw new Error("No changes to sign");
		}
		// prevent any further modifications to this tx
		this.lockTx = true;
		if (!this.txb.tx.txOuts.length) {
			this.txb.build({ useAllInputs: true });
		}
		this.txb.signWithKeyPairs([bsv.KeyPair.fromPrivKey(this.ctx.purse.privateKey), bsv.KeyPair.fromPrivKey(this.ctx.owner.privateKey)]);
	}

	/**
	 * Sync locations and nonces of all links in this transaction but keep their current state and changes.
	 * Arcane use only for if you need to force spend the latest link utxo
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
	 * Returns true if all inputs for this transaction are signed
	 */
	isFullySigned() {
		const flags = bsv.Interp.SCRIPT_VERIFY_P2SH | bsv.Interp.SCRIPT_ENABLE_SIGHASH_FORKID | bsv.Interp.SCRIPT_VERIFY_NULLDUMMY;
		return bsv.TxVerifier.verify(this.txb.tx, this.txb.uTxOutMap, flags);
	}

	/**
	 * Export JSON of this current transaction. @see LinkTransaction.exportHex for raw hex export
	 */
	export() {
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
			preActionSnapshot: this.actions.findIndex(x => x.linkProxy === x.linkProxy) === i ? x.preActionSnapshot : undefined
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
		} else {
			this.txb = new bsv.TxBuilder();
			this.lockTx = false;
			this.actions = [];
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
			(action.linkProxy as any)[Constants.SetState] = action.preActionSnapshot;
		}
		this.actions = [];
	}

	/**
	 * Pay with unspent utxos from the current context's purse address
	 */
	async pay(opts?: { payWith?: Utxo[]; payFromAddress?: string }) {
		if (!this.txb.txOuts.length) {
			await this.build();
		}

		const satsPerByte = 0.5;
		this.txb.setFeePerKbNum(satsPerByte * 1000);
		this.txb.setDust(0);
		let estimatedFee = Math.ceil(this.txb.estimateSize() * satsPerByte * 1000) * 2;

		const payAddress = opts?.payFromAddress ? Address.fromString(opts.payFromAddress) : this.ctx.purse.address;
		const payAddressStr = payAddress.toString();

		async function* getUtxos(ctx: LinkContext): AsyncGenerator<Utxo[], never> {
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
			throw new Error(`Not enough funds. Needed ${estimatedFee} more satoshis`);
		}

		const fetchUtxos = getUtxos(this.ctx);
		let paid = false;
		let utxos: Utxo[];
		do {
			utxos = (await fetchUtxos.next()).value;

			let utxo: Utxo;
			while (((utxo = utxos.pop()), utxo)) {
				// dont spend our link utxos
				if (this.isValidPurseUtxo(utxo)) {
					const outputScript = bsv.Script.fromPubKeyHash(payAddress.hashBuf);
					this.txb.inputFromPubKeyHash(
						Buffer.from(utxo.tx_hash, "hex").reverse(),
						utxo.tx_pos,
						bsv.TxOut.fromProperties(new Bn(utxo.value), outputScript)
					);
					this.ctx.logger?.log(`Input payment utxo ${utxo.tx_hash} ${utxo.tx_pos} ${utxo.value}`);
					estimatedFee -= utxo.value;
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

		this.txb.setChangeAddress(payAddress);
	}

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
		if (this.txb.txOuts.length) {
			this.txb = new bsv.TxBuilder();
		}
		const pendingOutputs: Array<{ toAddrStr: string | Group; satoshis: number }> = [];
		const uniqueEndLinks = new Map<ILink, RecordAction[]>();
		const uniqueStartLinks = new Map<ILink, RecordAction[]>();
		// const uniqueCreates = new Set<ITemplateClass>();
		for (const action of this.actions) {
			checkUntrackedLink(action, this.ctx);
			uniqueEndLinks.set(
				action.linkProxy,
				this.actions.filter(x => x.linkProxy === action.linkProxy)
			);
			uniqueStartLinks.set(
				this.actions.find(x => x.linkProxy === action.linkProxy).preActionSnapshot || action.linkProxy,
				this.actions.filter(x => x.linkProxy === action.linkProxy)
			);
		}

		const startLocations: string[] = [];
		// write each action utxos inputs
		for (const [link, actions] of Array.from(uniqueStartLinks)) {
			if (!link?.location) {
				const hasNew = actions.some(x => x.type === LinkRecord.NEW);
				const hasDeploy = actions.some(x => x.type === LinkRecord.DEPLOY);
				if (!hasNew && !hasDeploy) {
					throw new Error(
						`Link does not have a location and it wasn't created in this transaction ${link.owner} ${actions[0].target} ${link}`
					);
				}
				if (hasNew && link instanceof Link && link.templateLocation) {
					// get template owner and sign this creation so it is legit
					const template = link.constructor as ILinkClass;
					if (template.owner !== link.owner) {
						if ((template.owner as any) instanceof Group) {
							throw new Error("A template cannot be owned by a group");
						}
						// get a unspent utxo from the owner address
						const ownerUtxos = await this.ctx.api.getUnspentUtxos(template.owner);
						const utxo = ownerUtxos.find(x => x.value === template.satoshis || template.location.startsWith(x.tx_hash));
						if (!utxo) {
							throw new Error(`Cannot find utxo for template ${link[LinkSv.TemplateName]} owner ${template.owner}`);
						}

						// spend the utxo back to the same owner address to make them sign
						this.addInput(`${utxo.tx_hash}_${utxo.tx_pos}`, template.owner, utxo.value);
						pendingOutputs.push({ toAddrStr: template.owner, satoshis: template.satoshis });
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
				this.addInput(link.location, link.owner, link.satoshis);
			}
		}

		let txOutputIndex = pendingOutputs.length + 1; // +1 for script as first output
		const outputScript = [];
		// write each action utxos outputs
		for (const [link, actions] of Array.from(uniqueEndLinks)) {
			if (!link.isDestroyed) {
				outputScript.push(link);
				if (!link.owner) {
					throw new Error(`Link does not have an owner ${link.location}`);
				}
				const satLimit = this.ctx.dontSpendUtxosWithValueLessThan || this.ctx.linkSatoshiValue;
				if (link.satoshis > satLimit && this.ctx.owner.addressStr === this.ctx.purse.addressStr) {
					throw new Error(
						`Cannot create a link with satoshis greater than ${satLimit} while your purse private key matches your owner private key. ${link}`
					);
				}
				pendingOutputs.push({ toAddrStr: link.owner, satoshis: link.satoshis });
				for (const action of this.actions.filter(x => x.linkProxy === link)) {
					action.outputIndex = txOutputIndex;
				}
				txOutputIndex++;
			}
		}

		// now record the outputs in order
		const script = this.createScript(startLocations, outputScript);
		this.txb.outputToScript(new Bn(0), script);

		for (const outp of pendingOutputs) {
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

		if (this.isFullySigned()) {
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
			const raw = this.txb.tx.toHex();
			const txid = await this.ctx.api.broadcast(raw);
			this.txid = txid;

			const updateMap = new Map<string, { location: string; nonce: number }>();
			try {
				// write location
				for (const action of this.actions) {
					if (!action.linkProxy.isDestroyed) {
						const underlying = getUnderlying(action.linkProxy);
						underlying.location = `${txid}_${action.outputIndex}`;
						underlying.nonce++;
						if (action.type === LinkRecord.NEW) {
							(underlying as Link).origin = `${txid}_${action.outputIndex}`;
						}
						if (action.linkProxy instanceof Link) {
							updateMap.set(action.linkProxy.origin, { location: action.linkProxy.location, nonce: action.linkProxy.nonce });
						}
					}
					action.linkProxy[LinkSv.HasChanges] = false;
				}
				// write location in the provider store
				await this.ctx.updateProvider(
					Array.from(updateMap).map(([origin, x]) => ({ origin, location: x.location, nonce: x.nonce }))
				);
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
	 */
	exportHex() {
		const raw = this.txb.tx.toHex();
		return raw;
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
				TxOut.fromProperties(new Bn(satoshis), outputScript)
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

	private createScript(startLocations: string[], uniqueEnds: ILink[]) {
		const record: ChainRecord = {
			i:
				startLocations.length === uniqueEnds.length
					? undefined
					: uniqueEnds.map(x => {
							return startLocations.indexOf(x.location);
					  }),
			o: uniqueEnds.map(x => {
				const inst = getUnderlying(x);
				// increment nonce for the script but dont change the instance just yet
				return Object.setPrototypeOf({ ...inst, nonce: inst.nonce + 1 }, Object.getPrototypeOf(inst));
			})
		};

		if (record.i && !record.i.length) {
			record.i = undefined;
		}

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
					const rtn: LinkRef = { $: "_" + action.outputIndex, t: val[LinkSv.TemplateName] };
					return rtn;
				} else if (val.location) {
					const rtn: LinkRef = { $: val.location, t: val[LinkSv.TemplateName] };
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
				if (!(val as any)[Constants.HasProxy]) {
					throw new Error(
						`Tried to record a link to the chain that has no location, and was created with constructUntracked. ${key} ${val}`
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

		const data = LinkContext.activeContext.compression.compress(json);
		const script = new bsv.Script();
		script.writeOpCode(bsv.OpCode.OP_FALSE);
		script.writeOpCode(bsv.OpCode.OP_RETURN);
		if (LinkContext.activeContext.app) {
			script.writeBuffer(Buffer.from(LinkContext.activeContext.app));
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
	static _record(
		type: LinkRecord,
		target: string,
		proxy: ILink,
		preState: ILink,
		postState: ILink,
		fromTemplate: ILinkClass,
		args: any[]
	) {
		if (!LinkTransaction._currentTx) {
			throw new Error("Links can only be updated inside a Transaction");
		}
		LinkTransaction._currentTx._record(type, target, proxy, preState, postState, fromTemplate, args);
	}

	_record(type: LinkRecord, target: string, proxy: ILink, preState: ILink, postState: ILink, fromTemplate: ILinkClass, args: any[]) {
		this.actions.push({
			type,
			target,
			args,
			outOwner: proxy.owner,
			inOwner: proxy.owner,
			preActionSnapshot: preState,
			postActionSnapshot: postState,
			fromTemplate,
			linkProxy: proxy
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
	DEPLOY = "DEPLOY",
	CALL = "CALL"
}

type RecordAction = {
	type: LinkRecord;
	target: string;
	preActionSnapshot: ILink;
	postActionSnapshot: ILink;
	linkProxy: ILink;
	fromTemplate: ILinkClass;
	inOwner: string | Group;
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