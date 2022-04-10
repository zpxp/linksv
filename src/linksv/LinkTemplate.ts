import { LinkContext, LinkTransaction } from ".";
import { Constants } from "./Constants";
import { proxyInstance } from "./InstanceProxy";
import { ILinkClass, Link } from "./Link";
import { LinkRecord } from "./LinkTransaction";

export function LinkTemplate(uniqueName: string) {
	return function Wrap<T extends object>(c: T): T {
		if (uniqueName in LinkContext.templates) {
			throw new Error(`Template with name '${uniqueName}' already Linked`);
		}

		(c as any)[Constants.IsProxy] = true;
		(c as ILinkClass).templateName = uniqueName;

		const rtn = new Proxy<T>(c, {
			construct(target: any, argArray: any[], newTarget: any): object {
				const template = c as ILinkClass;
				const inst: Link = Reflect.construct(target, argArray, newTarget);
				// if template is deployed, set its loca
				inst.templateLocation = template.location || undefined;
				inst.nonce = 0;
				if (template.constructUntracked) {
					return inst;
				}
				if (!inst.owner) {
					inst.owner = LinkContext.activeContext.owner.addressStr;
				}
				const prox = proxyInstance(inst);
				LinkTransaction._record(LinkRecord.NEW, uniqueName, prox, null, null, template, argArray);
				return prox;
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
				if (p === Constants.UnderlyingInst) {
					return c;
				}
				if (p === Constants.TemplateName || p === "name") {
					return uniqueName;
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
			set(target: T, p: string | symbol, value: any): boolean {
				if (p === Constants.HasChanges) {
					return Reflect.set(target, p, value);
				}
				throw new Error("Cannot set property outside method");
			},
			setPrototypeOf(): boolean {
				throw new Error("Cannot change prototype");
			}
		});

		LinkContext.templates[uniqueName] = rtn as ILinkClass;
		return rtn;
	};
}
