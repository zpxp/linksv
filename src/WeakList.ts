/**
 * this list is weak af
 */
export class WeakList<T extends object> extends Array<WeakRef<T>> {
	constructor(list?: T[]) {
		if (list?.length) {
			super(list.length);
		} else {
			super();
		}

		if (list) {
			for (let index = 0; index < list.length; index++) {
				const element = list[index];
				this.push(new WeakRef(element));
			}
		}
	}

	getInstances(): ReadonlyArray<T> {
		const rtn = [];
		for (let i = this.length - 1; i >= 0; i--) {
			const item = this[i];
			const ref = item?.deref();
			if (ref) {
				rtn.push(ref);
			} else {
				// remove it
				this.splice(i, 1);
			}
		}
		return rtn;
	}
}
