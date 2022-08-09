import { getUnderlying } from "./InstanceProxy";
import { Link } from "./Link";
import { LinkTemplate } from "./LinkTemplate";



/**
 * Instead of storing a file or buffer directly in your application's link classes, wrap them with an instance of this class
 * and store that instance instead. This means the file or buffer will be written to chain as a pointer, and copies of it
 * will not be written to chain every time you update the parent link, saving in network fees.
 */
@LinkTemplate("__FileLink")
export class FileLink extends Link {
	private _obj: File | Buffer;
	constructor(fileOrBuffer: File | Buffer) {
		super();
		this._obj = fileOrBuffer;
	}

	get file() {
		const raw = getUnderlying(this)
		return Buffer.isBuffer(raw._obj) ? null : raw._obj;
	}

	get buffer() {
		const raw = getUnderlying(this)
		return Buffer.isBuffer(raw._obj) ? raw._obj : null;
	}

	get value() {
		const raw = getUnderlying(this)
		return raw._obj;
	}
}
