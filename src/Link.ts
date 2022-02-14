import { LinkContext, Transaction } from "src";
import { Constants } from "./Constants";
import { proxyInstance } from "./InstanceProxy";
import { Template } from "./Template";
import { Records } from "./Transaction";

export function Link(uniqueName: string) {
	return function Wrap<T extends object>(c: T): T {
		(c as any)[Constants.IsProxy] = true;

		return new Proxy<T>(c, {
			construct(target: any, argArray: any[], newTarget: any): object {
				Transaction._record(Records.CTOR, uniqueName, argArray);
				return proxyInstance(Reflect.construct(target, argArray, newTarget));
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
				return Reflect.get(target, p, receiver);
			},
			getOwnPropertyDescriptor(target: T, p: string | symbol): PropertyDescriptor | undefined {
				const rtn = Reflect.getOwnPropertyDescriptor(target, p);
				rtn.configurable = false;
				return rtn;
			},
			getPrototypeOf(target: T): object | null {
				return Object.getPrototypeOf(target);
			},
			// has(target: T, p: string | symbol): boolean {},
			// isExtensible(target: T): boolean {},
			// ownKeys(target: T): ArrayLike<string | symbol> {},
			// preventExtensions(target: T): boolean {},
			set(): boolean {
				throw new Error("Cannot set property outside method");
			},
			setPrototypeOf(): boolean {
				throw new Error("Cannot change prototype");
			}
		});
	};
}
