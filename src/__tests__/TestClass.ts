import { Template } from "src";
import { Constants } from "src/Constants";
import { Link } from "src/Link";

@Link
class Sword extends Template {
	name: string;
	owner: string;

	constructor(owner: string, name: string) {
		super();

		this.owner = owner;
		this.name = name;
	}

	changeName(name: string) {
		this.name = name;
	}
}


describe("link", () => {
	test("Should Construct", () => {
		const inst = new Sword("address", "cool sword");
		console.log(inst);
		expect(inst).toEqual(expect.anything());
	});

	test("Is Proxy", () => {
		const inst = new Sword("address", "cool sword");
		expect((inst as any)[Constants.IsProxy]).toEqual(true);
	});

	test("Block edit", () => {
		const inst = new Sword("address", "cool sword");

		expect(() => {
			inst.name = "gg";
		}).toThrow();
	});

	test("Edit thru function", () => {
		const inst = new Sword("address", "cool sword");
		inst.changeName("gg");
		expect(inst.name).toEqual("gg");
	});
});
