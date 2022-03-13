import { PubKey } from "bsv";

export class Group {
	pubKeys: PubKey[];
	pubKeyStrs: string[];

	constructor(ownerPubKeys: string[], required: number);
	constructor(ownerPubKeys: PubKey[], required: number);
	constructor(ownerPubKeys: string[] | PubKey[], public required: number) {
		if (!ownerPubKeys.length) {
			throw new Error("Required ownerPubKeys");
		}
		for (let index = 0; index < ownerPubKeys.length; index++) {
			const item = ownerPubKeys[index];
			if (typeof item === "string") {
				ownerPubKeys[index] = PubKey.fromString(item);
			}
		}

		this.pubKeys = ownerPubKeys as PubKey[];
		this.pubKeyStrs = this.pubKeys.map(x => x.toString())
	}
}


export function isGroupLike(a:any): a is Group {
	return a && "required" in a && "pubKeys" in a && "pubKeyStrs" in a
}