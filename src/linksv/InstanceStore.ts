import { Link } from "./Link";
import { WeakList } from "./WeakList";

export class InstanceStore {
	private instances: WeakList<Link>;

	constructor() {
		this.instances = new WeakList();
	}

	getLocation(location: string) {
		const insts = this.instances.getInstances();
		return insts.find(x => x.location === location);
	}

	getOrigin(origin: string) {
		const insts = this.instances.getInstances();
		return insts.find(x => x.origin === origin);
	}

	set(inst: Link) {
		const insts = this.instances.getInstances();
		if (!inst.location || !insts.find(x => x.location === inst.location)) {
			this.instances.push(inst);
		}
	}

	remove(inst: Link) {
		this.instances.remove(inst);
	}
}
