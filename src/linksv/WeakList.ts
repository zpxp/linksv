/**
 * this list is weak af
 */
export class WeakList<T extends object> {
	private list: Array<WeakRef<T>>;
	constructor(list?: T[]) {
		this.list = [];

		if (list) {
			for (let index = 0; index < list.length; index++) {
				const element = list[index];
				this.list.push(new WeakRef(element));
			}
		}
	}

	push(item: T) {
		return this.list.push(new WeakRef(item));
	}

	remove(item: T) {
		const index = this.list.findIndex(x => x.deref() === item);
		if (~index) {
			this.list.splice(index, 1);
		}
	}

	getInstances(): ReadonlyArray<T> {
		const rtn = [];
		for (let i = this.list.length - 1; i >= 0; i--) {
			const item = this.list[i];
			const ref = item?.deref();
			if (ref) {
				rtn.push(ref);
			} else {
				// remove it
				this.list.splice(i, 1);
			}
		}
		return rtn;
	}
}
