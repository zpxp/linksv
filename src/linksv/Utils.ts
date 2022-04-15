import { Constants, LinkSv } from "./Constants";
import { Group } from "./Group";
import { LinkContext } from "./LinkContext";
import { ILink, ILinkClass, Link } from "./Link";
import { LinkTransaction } from "./LinkTransaction";

/**
 * A deep copy that can handle link instances
 * @param source
 * @returns
 */
export function deepCopy<T>(source: T, transformer?: (item: any) => any): T {
	let copy = Array.isArray(source)
		? source.map(item => deepCopy(item, transformer))
		: source instanceof Date
		? new Date(source.getTime())
		: source instanceof Group
		? source
		: source && typeof source === "object" && (source as any)[Constants.IsProxy]
		? source
		: source && typeof source === "object"
		? Object.getOwnPropertyNames(source).reduce((o, prop) => {
				Object.defineProperty(o, prop, Object.getOwnPropertyDescriptor(source, prop)!);
				o[prop] = deepCopy((source as { [key: string]: any })[prop], transformer);
				return o;
		  }, Object.create(Object.getPrototypeOf(source)))
		: (source as T);

	if (transformer) {
		copy = transformer(copy);
	}

	return copy;
}

/**
 * Convert json objects into link proxys
 * @param source
 * @param ctx
 * @param loadTx
 * @returns
 */
export async function deepLink<T>(
	source: T,
	ctx: LinkContext,
	activeTx: LinkTransaction,
	loadTx: (outputIdxOrLocation: number | string, templateType: string) => Promise<ILink>,
	loadFile: (file: FileRef) => File,
	addInstance: (link: Link) => Link
): Promise<T> {
	if (!source) {
		return source;
	}
	if (Array.isArray(source)) {
		for (let index = 0; index < source.length; index++) {
			const item = source[index];
			source[index] = await deepLink(item, ctx, activeTx, loadTx, loadFile, addInstance);
		}
		return source;
	}
	if (source instanceof Date || source instanceof Group || (source as any)[Constants.IsProxy]) {
		return source;
	}

	if (isLinkRef(source)) {
		// convert to link
		if (/^_(\d+)$/.test(source.$)) {
			// is output index
			const loca = parseInt(source.$.slice(1), 10);
			return (await loadTx(loca, source.t)) as any;
		} else {
			// is location
			return (await loadTx(source.$, source.t)) as any;
		}
	} else if (isFileRef(source)) {
		return loadFile(source) as any;
	} else if (source && typeof source === "object") {
		for (const prop of Object.getOwnPropertyNames(source)) {
			const val = (source as any)[prop];
			if (prop !== "preActionSnapshot" && prop !== "postActionSnapshot") {
				// dont link the tx export snapshots
				(source as any)[prop] = await deepLink(val, ctx, activeTx, loadTx, loadFile, addInstance);
			}
		}

		if (
			source instanceof Link &&
			!source[LinkSv.IsProxy] &&
			!(source as any)[Constants.HasProxy] &&
			!(source.constructor as ILinkClass).constructUntracked
		) {
			if (activeTx) {
				// track it
				source = activeTx.track(source);
			} else {
				// proxy it
				source = addInstance(source) as any;
			}
		}
	}

	return source;
}

export const deserializeLink = Symbol("__link");
export const deserializeFile = Symbol("__file");

export type LinkRef = {
	[deserializeLink]?: boolean;
	/** location or output index */
	$: string;
	/** template type/id */
	t: string;
};

export type FileRef = {
	[deserializeFile]?: boolean;
	/** output index */
	$file: number;
	name:string,
	/** mime type */
	type: string
};

function isLinkRef(o: any): o is LinkRef {
	return o && typeof o === "object" && deserializeLink in o;
}

function isFileRef(o: any): o is FileRef {
	return o && typeof o === "object" && deserializeFile in o;
}

export function chunk<T>(arr: T[], chunk: number): T[][] {
	let i: number, j: number, temporary: T[];
	const rtn = [];
	for (i = 0, j = arr.length; i < j; i += chunk) {
		temporary = arr.slice(i, i + chunk);
		rtn.push(temporary);
	}
	return rtn;
}
