import { LinkTemplate, Link } from "..";



@LinkTemplate("Sword")
export class Sword extends Link {
	name: string;
	owner: string;

	constructor(name: string) {
		super();

		this.name = name;
	}

	changeName(name: string) {
		this.name = name;
	}
}
