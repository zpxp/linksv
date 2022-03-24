import { Link } from "./Link";
import { WeakList } from "./WeakList";

export class InstanceStore {
	private instances: WeakList<Link> = new WeakList();

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
		if (!insts.find(x => x.location === inst.location)) {
			this.instances.push(new WeakRef(inst));
		}
	}
}