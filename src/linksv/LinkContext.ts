import { WhatsOnChainApi } from "./apis/WhatsOnChain";
import { Group, isGroupLike } from "./Group";
import { IApiProvider } from "./IApiProvider";
import { ILinkProvider, ProviderData } from "./ILinkProvider";
import { getUnderlying, proxyInstance } from "./InstanceProxy";
import { InstanceStore } from "./InstanceStore";
import { ILink, ILinkClass, LINK_DUST, Link } from "./Link";
import { ChainRecord, LinkTransaction } from "./LinkTransaction";
import { decodeChainBuffer, deepLink, deserializeFile, deserializeLink, LinkRef } from "./Utils";
import { Constants, LinkSv } from "./Constants";
import { IUtxoStore } from "./IUtxoStore";
import { IndexedDbUtxoStore } from "./utxostores/IndexedDbUtxoStore";
import * as bsv from "bsv";
import { TxBuilderLike } from "bsv/index";
import { ICompression } from "./ICompression";
import { ZLibCompression } from "./compression/ZLibCompression";
import { MockUtxoStore } from "./utxostores/MockUtxoStore";
import { Tx } from "bsv";

const isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";

export class LinkContext {
	readonly purse: Keys;
	readonly owner: Keys;
	readonly api: IApiProvider;
	readonly store: InstanceStore;
	readonly provider: ILinkProvider;
	readonly compression: ICompression;
	readonly app: string;

	utxoStore?: IUtxoStore;
	serializeTransformer: (key: string, val: any) => any;
	deserializeTransformer: (key: string, val: any) => any;

	/** blank object to assign references unique to this context */
	params: { [key: string | symbol]: any };
	logger: Console;
	readonly dontSpendUtxosWithValueLessThan: number;
	readonly linkSatoshiValue: number;
	readonly templateSatoshiValue: number;
	readonly allowSerializeNewLinks: boolean;
	satoshisPerByteFee: number;

	constructor(opts: {
		purse: string;
		owner?: string;
		api?: IApiProvider;
		provider: ILinkProvider;
		app?: string;
		/**
		 * Store to record purse utxos. On browsers, defaults to IndexedDbUtxoStore while nodejs defaults to MockUtxoStore
		 */
		utxoStore?: IUtxoStore;
		compression?: ICompression;
		logger?: typeof console;
		/** transaction fee to pay based on size */
		satoshisPerByteFee?: number;
		/**
		 * only spend purse utxos with satoshi value greater than this. Set it to a value greater than linkSatoshiValue when using
		 * the same wallet for purse and owner
		 */
		dontSpendUtxosWithValueLessThan?: number;
		/** Satoshi value to assign link utxos */
		linkSatoshiValue?: number;
		/** Satoshi value to assign template utxos. Cannot be the same value as linkSatoshiValue  */
		templateSatoshiValue?: number;
		/**
		 * Allow serialization of new links that have not yet been given a location in the `LinkContext.serialize` function.
		 * Enabling this can create complex reference bugs in your application, defaults to false.
		 */
		allowSerializeNewLinks?: boolean;
		/** json key:val transformer/validator for `serialize` and `publish` */
		serializeTransformer?: (key: string, val: any) => any;
		/** json transformer for `deserialize` and parsing chain data */
		deserializeTransformer?: (key: string, val: any) => any;
	}) {
		if (!opts.purse) {
			throw new Error("Purse key not specified");
		}

		this.compression = opts.compression || new ZLibCompression();
		this.provider = opts.provider;
		this.app = opts.app;
		this.satoshisPerByteFee = opts.satoshisPerByteFee || 0.1;
		this.linkSatoshiValue = opts.linkSatoshiValue || LINK_DUST;
		// this must be different to linkSatoshiValue so we dont spend a link by accident
		this.templateSatoshiValue = opts.templateSatoshiValue || LINK_DUST - 1;
		this.dontSpendUtxosWithValueLessThan = opts.dontSpendUtxosWithValueLessThan;
		this.serializeTransformer = opts.serializeTransformer;
		this.deserializeTransformer = opts.deserializeTransformer;
		this.api = opts.api || new WhatsOnChainApi();
		this.utxoStore = opts.utxoStore || (isBrowser ? new IndexedDbUtxoStore() : new MockUtxoStore());
		this.purse = getKeys(opts.purse);
		this.owner = getKeys(opts.owner) || this.purse;
		this.allowSerializeNewLinks = opts.allowSerializeNewLinks;
		this.logger = opts.logger;
		if (!LinkContext.activeContext) {
			LinkContext.activeContext = this;
		}
		this.store = new InstanceStore();
		this.loadCache = new LoadCache(this);
		this.params = {};
	}

	static templates: { [templateId: string]: ILinkClass } = {};
	static chainClasses: { [chainClassName: string]: { new (...args: any[]): any } } = {};
	static activeContext: LinkContext;
	private loadCache: LoadCache;

	/**
	 * Clear all loaded Tx values from the local cache
	 */
	clearTxCache() {
		this.loadCache = new LoadCache(this);
	}

	/**
	 * Set this LinkContext as the active context
	 */
	activate() {
		LinkContext.activeContext = this;
	}

	/**
	 * Create new LinkTransaction
	 */
	newTransaction() {
		return new LinkTransaction();
	}

	/**
	 * Track a proxy instance in the reference store. May return a different
	 * instance if an older version of that link existed within the store
	 * @param proxy
	 */
	addInstance(proxy: Link) {
		if (!proxy[LinkSv.IsProxy]) {
			// untracked
			return proxy;
		}

		const existingOrigin = proxy.origin && this.store.getOrigin(proxy.origin);
		if (existingOrigin && (existingOrigin.nonce < proxy.nonce || existingOrigin !== proxy)) {
			// update it
			(existingOrigin as any)[Constants.SetState] = getUnderlying(proxy);
			return existingOrigin;
		}

		const existingLoca = proxy.location && this.store.getLocation(proxy.location);
		if (existingLoca && existingLoca !== proxy) {
			// update it
			(existingLoca as any)[Constants.SetState] = getUnderlying(proxy);
			return existingLoca;
		}
		this.store.set(proxy);
		return proxy;
	}

	/**
	 * Get the template class for a given unique name
	 * @param uniqueName
	 * @returns class
	 */
	getTemplate(uniqueName: string) {
		const type = LinkContext.templates[uniqueName];
		if (!type) {
			throw new Error(`Template class not found for type '${uniqueName}'`);
		}
		return type;
	}

	/**
	 * Make a network call to the api to get the number of satoshis in the purse wallet. Will populate
	 * the IUtxoStore store with the result.
	 * @returns total value of purse wallet in satoshis
	 */
	async getPurseBalance(): Promise<bsv.Bn> {
		const utxos = await this.api.getUnspentUtxos(this.purse.addressStr);
		await this.utxoStore.removeAll(this.purse.addressStr);
		await this.utxoStore.setUnspent(this.purse.addressStr, utxos);
		let bn = new bsv.Bn();
		for (const utxo of utxos) {
			bn = bn.add(utxo.value);
		}
		return bn;
	}

	/**
	 * Load a data link and return the template instance
	 * @param template Link template class to load into
	 * @param location Data location to load in format <txid>_<output index>
	 * @param opts
	 * @returns
	 */
	async load<T extends ILinkClass, R extends InstanceType<T>>(
		template: T,
		location: string,
		opts: { trackInstances?: boolean; checkOrigin?: boolean; shallow?: boolean; ignoreMissingTemplates?: boolean } = {}
	): Promise<R> {
		opts.trackInstances ??= true;
		try {
			const storeInst = opts.checkOrigin
				? this.store.getOrigin(location) || this.store.getLocation(location)
				: this.store.getLocation(location);
			if (storeInst) {
				// return existing instance
				return storeInst as R;
			}
			const { chainData, tx, files } = await this.getChainData(location);
			this.loadCache.loadStaged();
			let inst = await this.loadTx(template, location, chainData, files, tx, opts.shallow, opts.ignoreMissingTemplates);
			if (opts.trackInstances) {
				inst = this.addInstance(inst) as R;
			}
			return inst as R;
		} catch (e) {
			this.logger?.error(`Failed to load ${template.name} ${location}`, e);
			throw e;
		}
	}

	/**
	 * Load a data link and return the link instances
	 * @param templates An array of link locations to load and their corresponding template classes
	 * @param opts
	 * @returns
	 */
	async bulkLoad(
		templates: Array<{ template: ILinkClass; location: string }>,
		opts: { trackInstances?: boolean; shallow?: boolean; ignoreMissingTemplates?: boolean } = {}
	): Promise<{ [location: string]: Link }> {
		if (templates.length === 1) {
			const res = await this.load(templates[0].template, templates[0].location);
			return { [res.location]: res };
		}
		try {
			opts.trackInstances ??= true;
			templates = templates.filter(x => x.location);
			const existing = templates.map(x => ({ x, res: this.store.getLocation(x.location) }));
			const found = existing.filter(x => !!x.res);
			const missing = existing.filter(x => !x.res);

			const res = await this.getBulkChainData(missing.map(x => x.x.location));
			this.loadCache.loadStaged();
			const zipped = zipArr(res, missing);
			const loaded = await Promise.all(
				zipped.map(x =>
					this.loadTx(
						x[1].x.template,
						x[1].x.location,
						x[0].chainData,
						x[0].files,
						x[0].tx,
						opts.shallow,
						opts.ignoreMissingTemplates
					)
				)
			);
			if (opts.trackInstances) {
				for (let index = 0; index < loaded.length; index++) {
					const inst = loaded[index];
					loaded[index] = this.addInstance(inst);
				}
			}
			const rtn = found.map(x => x.res).concat(loaded);
			return Object.fromEntries(rtn.map(x => [x.location, x]));
		} catch (e) {
			this.logger?.error(`Failed to bulk load`, e);
			throw e;
		}
	}

	/**
	 * Load a data link and return the link instances
	 * @param templates An array of link locations to load and their corresponding template classes
	 * @param opts
	 * @returns
	 */
	async bulkLoadList(
		templates: Array<{ template: ILinkClass; location: string }>,
		opts: { trackInstances?: boolean; shallow?: boolean; ignoreMissingTemplates?: boolean } = {}
	): Promise<Link[]> {
		const rtn = await this.bulkLoad(templates, opts);
		return Object.entries(rtn).map(x => x[1]);
	}

	/**
	 * Import raw tx hex and return a LinkTransaction
	 * @param rawTxHexOrTxExport tx hex or LinkTransaction json export
	 * @param @see LinkContext.deserialize trackNewInstances
	 * @returns
	 */
	async import(rawTxHexOrTxExport: string, trackNewInstances?: LinkTransaction): Promise<LinkTransaction> {
		if (rawTxHexOrTxExport && rawTxHexOrTxExport.startsWith("{") && rawTxHexOrTxExport.endsWith("}")) {
			const json = await this.deserialize<TxBuilderLike>(rawTxHexOrTxExport);
			return new LinkTransaction(json);
		}
		return new LinkTransaction(rawTxHexOrTxExport);
	}

	/**
	 * Return the tx and raw link json data for a txid
	 * @param txid
	 * @returns
	 */
	async getRawChainData(txid: string) {
		const tx = await this.loadCache.fetchTx(txid);
		return this.processRawTx(txid, tx);
	}

	async getBulkRawChainData(txids: string[]) {
		const txs = await this.loadCache.bulkFetchTxMap(txids).then(x =>
			Object.entries(x).map(([txid, tx]) => {
				if (!tx || !txid) {
					throw new Error(`Cannot find tx for one txid ${txid} `);
				}
				return [txid, this.processRawTx(txid, tx)];
			})
		);
		return Object.fromEntries(txs);
		// return Object.fromEntries(txs.map(x => [x.tx.hash().reverse().toString("hex"), x]));
	}

	/**
	 * JSON serialize an object that contains links
	 * @param item
	 */
	serialize(item: Link | Link[] | any) {
		return JSON.stringify(item, (key, val) => {
			if (val instanceof Link) {
				if (Buffer.isBuffer(val) || (typeof File !== "undefined" && val instanceof File)) {
					throw new Error(`Cannot json serialize a File or Buffer`);
				}
				if (val[LinkSv.IsProxy] && val.location) {
					const rtn: LinkRef = { $: val.location, t: val[LinkSv.TemplateName] };
					return rtn;
				} else {
					// serialize it with template name
					val = Object.setPrototypeOf(
						{ ...val, ["t~"]: (val.constructor as ILinkClass).templateName },
						Object.getPrototypeOf(val)
					);

					if (val.forkOf && !val.location) {
						// re-assign this to allow deserialization
						val.location = val.forkOf;
						val.forkOf = undefined;
					}

					if (!val.location && !this.allowSerializeNewLinks) {
						throw new Error(
							`Cannot serialize link without location. Publish transaction before trying to serialize or enable allowSerializeNewLinks. ${
								val.origin
							} ${val.location} ${val.owner} ${(val.constructor as ILinkClass).templateName}`
						);
					}
				}
			}
			if (val && val.constructor && val.constructor[Constants.ChainClass]) {
				val = Object.setPrototypeOf({ ...val, ["~"]: val.constructor[Constants.ChainClass] }, Object.getPrototypeOf(val));
			}
			if (this.serializeTransformer) {
				val = this.serializeTransformer(key, val);
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
			return val;
		});
	}

	/**
	 * Deserialize a JSON string and re-inflate any link instances
	 * @param json
	 * @param trackNewInstances If deserializing new links that haven't been published, pass in a tx to automatically track those instances.
	 */
	async deserialize<T>(json: string, trackNewInstances?: LinkTransaction): Promise<T> {
		const data: T = this.processRawChainData<T>(json);
		this.loadCache.loadStaged();

		const finalState = await deepLink(
			data,
			this,
			trackNewInstances,
			(idxOrLocation, templateType) => {
				const type = LinkContext.templates[templateType];
				if (!type) {
					throw new Error(`Link class not found for type '${templateType}' location: ${idxOrLocation}`);
				}
				if (typeof idxOrLocation === "number") {
					throw new Error("Invalid string passed to deserialize. Was it created with LinkContext.serialize ?");
				} else {
					const existing = this.store.getLocation(idxOrLocation);
					if (existing) {
						return Promise.resolve(existing);
					}
					return this.load(type, idxOrLocation);
				}
			},
			() => null,
			link => this.handleDirtyLink(link)
		);

		return finalState;
	}

	/**
	 * Remove all links from the instance store with the same origin as the given link
	 * @param link
	 */
	purge(link: Link): void;

	/**
	 * Remove all links from the instance store. Any links now loaded will be granted a new instance, meaning you may have multiple references to the same
	 * link within your application. Use with caution.
	 */
	purge(): void;
	purge(link?: Link) {
		if (link) {
			for (let inst = this.store.getOrigin(link.origin); inst; inst = this.store.getOrigin(link.origin)) {
				this.store.remove(inst);
			}
		} else {
			this.store.clear();
		}
	}

	/**
	 * Record link's location and nonce with the provider. This is called automatically on publish but maybe
	 * you wish to import another client's link
	 * @param link
	 */
	async updateProvider(link: ProviderData | ProviderData[]): Promise<void> {
		if (Array.isArray(link)) {
			if (link.length === 1) {
				return this.provider.addLocation(link[0]);
			}
			return this.provider.bulkAddLocation(link);
		} else {
			return this.provider.addLocation(link);
		}
	}

	private handleDirtyLink(link: Link) {
		return this.addInstance(proxyInstance(link));
	}

	private async loadTx<T extends ILinkClass, R extends InstanceType<T>>(
		link: T,
		location: string,
		chainData: ChainRecord,
		files: Buffer[],
		tx: bsv.Tx,
		shallow: boolean,
		ignoreMissingTemplates: boolean
	): Promise<R> {
		const [txid, output] = location.split("_", 2);

		const outputIdx = parseInt(output, 10);
		if (isNaN(outputIdx)) {
			throw new Error("Invalid location cannot load " + location);
		}

		if (outputIdx === 0) {
			// its destroyed
			//return default instance
			const rtn: Link = Object.setPrototypeOf({}, link.prototype || link);
			rtn.location = location;
			rtn.satoshis = 0;
			return rtn as R;
		}

		let idx = outputIdx - 1;

		let index = 0;
		for (; index < idx; index++) {
			const element = chainData.o[index];
			if (!element) {
				// skip over null deleted states
				idx++;
			}
		}
		const state = chainData.o[index];
		state.location = location;
		if (!isTemplateClass(state) && !state.origin) {
			state.origin = location;
		}
		state.satoshis = tx.txOuts[outputIdx].valueBn.toNumber();
		const script = tx.txOuts[outputIdx].script;
		if (script.chunks[script.chunks.length - 1].opCodeNum === bsv.OpCode.OP_CHECKMULTISIG) {
			const threshold = script.chunks[0].opCodeNum - 80;
			const keys = script.chunks.slice(1, script.chunks.length - 2).map(x => bsv.PubKey.fromHex(x.buf.toString("hex")));
			state.owner = new Group(keys, threshold);
		} else {
			const address = bsv.Address.fromPubKeyHashBuf(script.chunks[2].buf);
			state.owner = address.toString();
		}

		const existing = !isTemplateClass(state) && this.store.getOrigin(state.origin);
		if (existing && existing.nonce >= state.nonce) {
			return existing as R;
		}

		const finalState = await deepLink(
			state,
			this,
			null,
			async (idxOrLocation, templateType) => {
				const type = LinkContext.templates[templateType];
				if (!type) {
					if (ignoreMissingTemplates) {
						return null;
					}
					throw new Error(`Template class not found for type '${templateType}' location: ${idxOrLocation}`);
				}
				if (shallow) {
					// dont load sub links
					return {
						location: typeof idxOrLocation === "number" ? `${txid}_${idxOrLocation}` : idxOrLocation,
						template: templateType
					};
				}
				if (typeof idxOrLocation === "number") {
					const newLoca = txid + "_" + idxOrLocation;
					const existing = this.store.getLocation(newLoca);
					if (existing) {
						return existing;
					}
					const p = await this.loadTx(type, newLoca, chainData, files, tx, shallow, ignoreMissingTemplates);
					return this.addInstance(p);
				} else {
					const existing = this.store.getLocation(idxOrLocation);
					if (existing) {
						return existing;
					}
					return this.load(type, idxOrLocation);
				}
			},
			ref => {
				if (typeof File !== "undefined" && "$file" in ref) {
					const buffer = files[ref.$file];
					return new File([buffer], ref.name, { type: ref.type });
				}

				const buffer = files["$file" in ref ? ref.$file : ref.$buf];
				return buffer;
			},
			link => this.handleDirtyLink(link)
		);

		let c: R = Object.setPrototypeOf(finalState, link.prototype || link);
		if (this.deserializeTransformer) {
			c = this.deserializeTransformer("", c);
		}
		const p = proxyInstance(c);

		return p as R;
	}

	private processRawTx(txid: string, tx: bsv.Tx) {
		const scriptOut = tx.txOuts.find(
			x =>
				x.valueBn.eq(0) &&
				x.script.chunks.length > 2 &&
				x.script.chunks[0].opCodeNum === bsv.OpCode.OP_FALSE &&
				x.script.chunks[1].opCodeNum === bsv.OpCode.OP_RETURN
		);
		if (!scriptOut) {
			throw new Error("Invalid tx in chain. No script data found " + tx.hash);
		}

		const chunks = scriptOut.script.chunks;
		const { json, files } = decodeChainBuffer(chunks, this);
		return { json, tx, files };
	}

	private async getChainData(location: string) {
		const [txid, output] = location.split("_", 2);
		const { json, tx, files } = await this.getRawChainData(txid);
		const chainData = this.processRawChainData<ChainRecord>(json);
		return { chainData, tx, files };
	}

	private async getBulkChainData(locations: string[]) {
		const txids = Array.from(new Set(locations.map(x => x.split("_", 2)[0])));
		const txs = await this.getBulkRawChainData(txids);
		return locations.map(location => {
			const [txid, output] = location.split("_", 2);
			if (!txs[txid]) {
				throw new Error(`Cannot find tx for location ${location}`);
			}
			const { tx, json, files } = txs[txid];
			const chainData = this.processRawChainData<ChainRecord>(json);
			return { chainData, tx, files };
		});
	}

	private processRawChainData<T>(json: string) {
		const chainData = JSON.parse(json, (key, val) => {
			if (val && typeof val === "object") {
				if ("$" in val) {
					const loca = val.$;
					if (typeof loca === "string") {
						this.loadCache.stage(loca);
						return { ...val, [deserializeLink]: true };
					}
				} else if ("$file" in val) {
					const file = val.$file;
					if (typeof file === "number") {
						return { ...val, [deserializeFile]: true };
					}
				} else if ("$buf" in val) {
					const file = val.$buf;
					if (typeof file === "number") {
						return { ...val, [deserializeFile]: true };
					}
				}
				if ("~" in val) {
					const chainClass = val["~"];
					if (typeof chainClass === "string" && chainClass in LinkContext.chainClasses) {
						delete val["~"];
						return Object.setPrototypeOf(val, LinkContext.chainClasses[chainClass].prototype);
					}
				}
				if ("t~" in val) {
					const template = val["t~"];
					if (typeof template === "string" && template in LinkContext.templates) {
						delete val["t~"];
						return Object.setPrototypeOf(val, LinkContext.templates[template].prototype);
					}
				}
				if (isGroupLike(val)) {
					// rehydrate the pubkeys
					val = new Group(val.pubKeyStrs, val.required);
				}
			}
			if (val === "NaN") {
				val = NaN;
			}
			if (val === "Infinity") {
				val = Infinity;
			}
			if (val === "-Infinity") {
				val = -Infinity;
			}

			if (this.deserializeTransformer) {
				val = this.deserializeTransformer(key, val);
			}
			return val;
		});
		return chainData as T;
	}
}

type Keys = {
	privateKey: bsv.PrivKey;
	publicKey: bsv.PubKey;
	address: bsv.Address;
	addressStr: string;
};

function getKeys(pk: string): Keys {
	if (pk) {
		const key = bsv.PrivKey.fromString(pk);
		const pub = bsv.PubKey.fromPrivKey(key);
		const addr = bsv.Address.fromPubKey(pub);
		return {
			privateKey: key,
			publicKey: pub,
			address: addr,
			addressStr: addr.toString()
		};
	}
}

/**
 * cache loaded txs
 */
class LoadCache {
	constructor(private ctx: LinkContext) {}

	pendingTx: { [txid: string]: Promise<{ [txid: string]: Tx }> } = {};
	stagedTxids: Set<string> = new Set();

	stage(locationOrTxid: string) {
		const txid = locationOrTxid.includes("_") ? locationOrTxid.split("_")[0] : locationOrTxid;
		if (txid) {
			// this may be falsy if it was a local location i.e. '_2'
			this.stagedTxids.add(txid);
		}
	}

	loadStaged() {
		const txids = Array.from(this.stagedTxids);
		if (txids.length === 1) {
			this.fetchTx(txids[0]);
		} else {
			this.bulkFetchTxMap(txids);
		}
		this.stagedTxids = new Set();
	}

	async fetchTx(txid: string) {
		const res = await this.fetchTxMap(txid);
		return res[txid];
	}

	private fetchTxMap(txid: string) {
		if (!(txid in this.pendingTx)) {
			const prom = this.ctx.api
				.getTx(txid)
				.then(tx => ({ [txid]: tx }))
				.catch(err => {
					// clear bad promise from cache
					delete this.pendingTx[txid];
					throw err;
				});
			this.pendingTx[txid] = prom;
		}

		return this.pendingTx[txid];
	}

	async bulkFetchTxMap(txids: string[]) {
		const existing = txids.filter(x => x in this.pendingTx);
		const rest = txids.filter(x => !(x in this.pendingTx));

		const prom = this.ctx.api.getBulkTx(rest).catch(err => {
			// clear bad promise from cache
			for (const txid of rest) {
				delete this.pendingTx[txid];
			}
			throw err;
		});

		for (const txid of rest) {
			this.pendingTx[txid] = prom;
		}

		const res = await Promise.all([prom, ...existing.map(x => this.fetchTxMap(x))]);
		return res.reduce((prev, next) => ({ ...prev, ...next }), {});
	}
}

function isTemplateClass(o: ILink): o is ILinkClass {
	return o && !!(o as ILinkClass).templateName;
}

function zipArr<T, G>(arr1: T[], arr2: G[]): [T, G][] {
	return arr1.map((x, i) => [x, arr2[i]]);
}
