import { ChainObject } from "./ChainObject";
import { Constants } from "./Constants";
import { proxyInstance } from "./InstanceProxy";

export abstract class Template extends ChainObject {
	constructor() {
		super();
		if (!(this.constructor as any)[Constants.IsProxy]) {
			throw new Error("Cannot create a Template class instance without @Link decorator: " + this.constructor.name);
		}
	}
}
