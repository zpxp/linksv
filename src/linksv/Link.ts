import { Constants, LinkSv } from "./Constants";
import { getUnderlying } from "./InstanceProxy";
import { Group } from "./Group";
import { LinkContext } from "./LinkContext";
import { LinkTransaction } from "./LinkTransaction";

export const LINK_DUST = 111; // 182;

/**
 * Base class for all links. Extend your template class with this and decorate it with @LinkTemplate
 * to track changes to class instances and write them to chain.
 */
export abstract class Link {
	static owner: string = "";
	static location: string = "";
	static nonce: number = 0;
	static satoshis: number = null;
	declare static readonly templateName: string;
	/**
	 * If set to true, instances of this template will be created as a regular js class instance
	 * instead of a proxy. Changes won't be tracked inside any transaction.
	 * To begin tracking instances, pass them to `LinkTransaction.track`
	 */
	declare static constructUntracked: boolean;

	/**
	 * If true, instances of this template cannot be destroyed and can have zero sat outputs.
	 * This may be useful for creating links that you cannot clean up later, so you don't have
	 * to worry about collecting their satoshis.
	 */
	declare static zeroSatInstances: boolean;

	constructor() {
		if (!(this.constructor as any)[LinkSv.IsProxy]) {
			throw new Error("Cannot create a Template class instance without @LinkTemplate decorator: " + this.constructor.name);
		}
		this.satoshis = LINK_DUST;
		this.location = null;
		this.origin = null;
	}

	/**
	 * The location of the first transaction that created this link, in the format <txid>_<utxo output index>
	 */
	origin: string;
	/**
	 * The current location of this link's data, in the format <txid>_<utxo output index>.
	 * If the link is destroyed, the format is <destroying txid>_0
	 */
	location: string;
	nonce: number;
	satoshis: number;
	owner: Group | string;
	/**
	 * Location of this link's template, or undefined if this link's template is not deployed.
	 * This is populated automatically
	 */
	templateLocation: string;

	/**
	 * Is link instance destroyed?
	 */
	get isDestroyed() {
		return this.satoshis === 0 && !(this.constructor as ILinkClass).zeroSatInstances;
	}

	/**
	 * Is the deployed template destroyed?
	 */
	static get isDestroyed() {
		return this.satoshis === 0;
	}

	/**
	 * Send the satoshis contained within this link to the purse address and destroy this output.
	 */
	destroy() {
		this.satoshis = 0;
	}

	/**
	 * When called inside a LinkTransaction, removes all changes to this object within that transaction, and rolls back to original state
	 */
	reset() {
		LinkTransaction.reset(this);
	}

	/**
	 * Sync this object to the latest location recorded in the context provider
	 * @param deep Also sync all children links?
	 * @returns
	 */
	async sync(deep?: boolean) {
		if (deep) {
			// aggregate all the links to sync then bulk load them
			// to save bandwidth and time
			const links: Link[] = [];
			collectLinks(this, links);
			const latests = await LinkContext.activeContext.provider.bulkGetLatestLocationForOrigin(links.map(x => x.origin));
			const mapped = Object.entries(latests).map(([origin, link]) => ({ link: links.find(l => l.origin === origin), latest: link }));
			const needsUpdating = mapped.filter(x => x.latest && x.latest.location !== x.link.location && x.latest.nonce > x.link.nonce);
			const result = await LinkContext.activeContext.bulkLoad(
				needsUpdating.map(x => ({ template: Object.getPrototypeOf(x.link), location: x.latest.location })),
				{ trackInstances: false }
			);
			for (const [location, link] of Object.entries(result)) {
				const updateThis = needsUpdating.find(
					x => (link instanceof Link && x.link.origin === link.origin) || x.link.location === location
				);
				if (!updateThis) {
					continue;
				}
				// this will overwrite this current instance
				(updateThis.link as any)[Constants.SetState] = getUnderlying(link);
				(updateThis.link as any)[Constants.HasChanges] = false;
			}
			return this.location;
		} else {
			const row = await LinkContext.activeContext.provider.getLatestLocationForOrigin(this.origin);
			if (row && row.location !== this.location && row.nonce > this.nonce) {
				const updated = await LinkContext.activeContext.load(Object.getPrototypeOf(this), row.location, { trackInstances: false });
				if (!updated) {
					throw new Error(`Cannot load location ${row.location} nothing found`);
				}
				// this will overwrite this current instance
				(this as any)[Constants.SetState] = getUnderlying(updated);
				(this as any)[Constants.HasChanges] = false;
				return row.location;
			}
			return null;
		}
	}

	toString() {
		return `[object ${(this.constructor as ILinkClass).templateName}]`;
	}

	[LinkSv.IsProxy]?: boolean;
	[LinkSv.HasChanges]?: boolean;
	[LinkSv.TemplateName]?: string;

	static [LinkSv.IsProxy]?: boolean;
}

export interface ILinkClass {
	new (...args: any[]): Link;
	owner: string;
	location: string;
	nonce: number;
	satoshis: number;
	templateName: string;
	constructUntracked?: boolean;
	zeroSatInstances?: boolean;
	get isDestroyed(): boolean;

	[LinkSv.IsProxy]?: boolean;
	[LinkSv.HasChanges]?: boolean;
	[LinkSv.TemplateName]?: string;
}

export type ILink = Link | ILinkClass;

function collectLinks(item: any, links: Link[]) {
	if (item instanceof Link && item.origin) {
		links.push(item);
	}

	// search children and sync
	for (const key of Object.keys(item)) {
		const val = item[key];

		if (Array.isArray(val)) {
			for (const arrItem of val) {
				if (arrItem) {
					collectLinks(arrItem, links);
				}
			}
		} else if (val instanceof Date || val instanceof Group) {
			continue;
		} else if (val && typeof val === "object") {
			collectLinks(val, links);
		}
	}
}
