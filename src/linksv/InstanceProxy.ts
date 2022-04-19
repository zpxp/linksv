import { Constants, LinkSv } from "./Constants";
import { ILink, ILinkClass, Link } from "./Link";
import { LinkRecord, LinkTransaction } from "./LinkTransaction";
import { deepCopy } from "./Utils";
import { LinkContext } from "./LinkContext";

let instNum = 0;

type Func = (...a: any[]) => any;

export function proxyInstance<T extends object | Func>(inst: T, parentProx?: any): T {
	if (inst && (inst as any)[Constants.IsProxy]) {
		return inst;
	}

	const proxyTarget =
		typeof inst === "function"
			? inst
			: Array.isArray(inst)
			? Object.assign([], {
					name: inst.constructor?.name,
					get inst() {
						return inst;
					},
					id: ++instNum
			  })
			: {
					name: inst.constructor?.name,
					get inst() {
						return inst;
					},
					id: ++instNum
			  };

	const syms: Map<symbol, any> = new Map();

	const prox = new Proxy<T>(proxyTarget as T, {
		apply(funcProx: T, thisArg: any, argArray: any[]): any {
			const isExternal = (funcProx as any)[Constants.ExternalFunc];
			const parent = getUnderlying(thisArg) as Link;
			if (parent.isDestroyed) {
				throw new Error("Instance destroyed");
			}
			const triggerChainWrite = thisArg === parentProx && !isExternal;
			const preState = triggerChainWrite ? deepCopy(parent) : null;
			const result: any = (inst as (...a: any[]) => void).apply(isExternal ? thisArg : parent, argArray);
			if (
				result &&
				typeof result === "object" &&
				"next" in result &&
				"throw" in result &&
				(Symbol.iterator in result || Symbol.asyncIterator in result)
			) {
				// is generator function.
				if (!isExternal) {
					LinkContext.activeContext.logger?.warn(
						`Calling a generator function on a template without decorating it with @linkExternal decorator. ${
							(inst as Func).name
						} ${parent?.constructor?.name}. It is now possible to write changes to link state without triggering chain write.`
					);
				}
				return result;
				// return proxyInstance(result, parentProx);
			}
			if (triggerChainWrite) {
				const postState = deepCopy(parent);
				// record state change
				const target = (inst as Func).name;
				LinkTransaction._record(LinkRecord.CALL, target, thisArg, preState, postState, argArray);
			}
			if (result && result[Constants.HasProxy]) {
				return result[Constants.HasProxy];
			}
			return result;
		},
		defineProperty(): boolean {
			throw new Error("Cannot define property outside method");
		},
		deleteProperty(): boolean {
			throw new Error("Cannot delete property outside method");
		},
		get(proxTarget: T, p: string | symbol, receiver: any): any {
			if (p === Constants.IsProxy) {
				return true;
			}
			if (p === Constants.UnderlyingInst) {
				return inst;
			}
			if (p === Constants.HasChanges) {
				return Reflect.get(proxTarget, "hasChanges", receiver) || false;
			}
			if (p === Constants.TemplateName) {
				return (inst.constructor as ILinkClass).templateName;
			}
			if (p === "toString") {
				return () => `[link ${(inst.constructor as ILinkClass).templateName}]`;
			}
			if (syms.has(p as symbol)) {
				return syms.get(p as symbol);
			}
			const rtn = Reflect.get(inst, p, receiver);
			// if the prop is on the root template and is a function, proxy it
			if (typeof rtn === "function" && !nativeFunctions.includes(p as string)) {
				if (!parentProx) {
					return proxyInstance(rtn, parentProx || prox);
				} else {
					// remove the proxy inst
					return rtn.bind(inst);
				}
			}
			if (rtn && !rtn[Constants.IsProxy] && rtn[Constants.HasProxy]) {
				return rtn[Constants.HasProxy];
			}
			if (!parentProx && rtn && typeof rtn === "object" && !rtn[Constants.IsProxy] && !Buffer.isBuffer(rtn)) {
				return proxyInstance(rtn, parentProx || prox);
			}
			return rtn;
		},
		getOwnPropertyDescriptor(_: T, p: string | symbol): PropertyDescriptor | undefined {
			const rtn = Reflect.getOwnPropertyDescriptor(inst, p);
			rtn.configurable = true;
			rtn.writable = false;
			return rtn;
		},
		ownKeys(_: T): ArrayLike<string | symbol> {
			return Reflect.ownKeys(inst);
		},
		getPrototypeOf(_: T): object | null {
			return Object.getPrototypeOf(inst);
		},
		isExtensible(_: T): boolean {
			return false;
		},
		has(_: T, p: string | symbol): boolean {
			return Reflect.has(inst, p);
		},
		preventExtensions(_: T): boolean {
			return true;
		},
		set(proxTarget: T, p: string | symbol, value: any, receiver: any): boolean {
			if (p === Constants.SetState) {
				inst = value;
				if (inst) {
					(inst as any)[Constants.HasProxy] = prox;
					if (typeof value !== "function") {
						Reflect.set(proxTarget, "name", inst.constructor?.name);
					}
				}
				return true;
			}
			if (p === Constants.HasChanges) {
				return Reflect.set(proxTarget, "hasChanges", value);
			}
			if (typeof p === "symbol") {
				// we can set symbols because those aren't saved to chain during serialization
				syms.set(p, value);
				return true;
			}

			throw new Error(`Cannot set property outside method ${p as string} ${proxTarget}`);
		},
		setPrototypeOf(): boolean {
			throw new Error("Cannot change prototype");
		}
	});

	if (!parentProx) {
		(inst as any)[Constants.HasProxy] = prox;
	}

	return prox;
}

export function getUnderlying<T extends Link | ILinkClass>(prox: T): T {
	return (prox as any)[Constants.UnderlyingInst] || prox;
}

const nativeFunctions = ["sync", "reset", "toJSON", "constructor"];

/**
 * Decorate a function within a link to prevent that function for triggering a chain write.
 * This function makes the ambient `this` variable within the decorated function a proxy
 * @param target
 * @param propertyKey
 * @param descriptor
 * @returns
 */
export function linkExternal(target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
	(descriptor.value as any)[Constants.ExternalFunc] = true;
	return descriptor;
}
