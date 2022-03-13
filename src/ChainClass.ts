import { LinkContext } from ".";
import { Constants } from "./Constants";

/**
 * Decorate a class to record its prototype when it is serialized onto chain.
 * Instances of the class cannot be recorded to chain by themselves, or assigned
 * a location, but instances inside a link instance can be recorded.
 * @param uniqueName
 * @returns
 */
export function ChainClass(uniqueName: string) {
	return function Wrap<T extends { new (...args: any[]): any }>(c: T): T {
		if (uniqueName in LinkContext.chainClasses) {
			throw new Error(`Chain Class with name '${uniqueName}' already Linked`);
		}

		(c as any)[Constants.ChainClass] = uniqueName;

		if (c.prototype.toJSON) {
			console.warn(
				`toJSON on @ChainClass ${uniqueName} ${c.name} may break the @ChainClass. Class prototype may not be written to chain`
			);
		}

		LinkContext.chainClasses[uniqueName] = c;
		return c;
	};
}
