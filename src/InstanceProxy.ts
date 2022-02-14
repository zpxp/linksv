import { Constants } from "./Constants";

const instSymbol = Symbol("__instance");

export function proxyInstance<T extends object>(inst: T): T {
	return new Proxy<T>(inst, {
		apply(target: T, thisArg: any, argArray: any[]): any {
			console.log(target);
			return (target as (...a: any[]) => void).apply(thisArg[instSymbol], argArray);
		},
		defineProperty(): boolean {
			throw new Error("Cannot define property outside method");
		},
		deleteProperty(): boolean {
			throw new Error("Cannot delete property outside method");
		},
		get(target: T, p: string | symbol, receiver: any): any {
			if (p === Constants.IsProxy) {
				return true;
			}
			if (p === instSymbol) {
				return target;
			}
			const rtn = Reflect.get(target, p, receiver);
			if (typeof rtn === "function") {
				return proxyInstance(rtn);
			}
			return rtn;
		},
		getOwnPropertyDescriptor(target: T, p: string | symbol): PropertyDescriptor | undefined {
			const rtn = Reflect.getOwnPropertyDescriptor(target, p);
			rtn.configurable = false;
			return rtn;
		},
		getPrototypeOf(target: T): object | null {
			return Object.getPrototypeOf(target);
		},
		isExtensible(target: T): boolean {
			return false;
		},
		preventExtensions(target: T): boolean {
			return true;
		},
		set(): boolean {
			throw new Error("Cannot set property outside method");
		},
		setPrototypeOf(): boolean {
			throw new Error("Cannot change prototype");
		}
	});
}
