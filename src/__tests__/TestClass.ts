import { LinkContext, Template } from "src";
import { Constants } from "src/Constants";
import { Link } from "src/Link";

// privKey cMrYJcQNS8qvim9VK1Yas4qyNgxsDkmMFUkFVEo24R4uE6GwZRMc
// pubKey 03b461314919e592d0cf64710df9e2ef6ccc48d03ae0d72f1119e6066f1ccbcc4e
// address mzBJZHMC95f4AiYqxaX94VY7ULFwHNfwbZ

const ctx = new LinkContext({ wallet: "cMrYJcQNS8qvim9VK1Yas4qyNgxsDkmMFUkFVEo24R4uE6GwZRMc" });

@Link("Sword")
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
		const tx = ctx.newTransaction();
		const inst = tx.update(() => new Sword("address", "cool sword"));
		console.log(inst);
		expect(inst).toEqual(expect.anything());
	});

	test("Is Proxy", () => {
		const tx = ctx.newTransaction();
		const inst = tx.update(() => new Sword("address", "cool sword"));
		expect((inst as any)[Constants.IsProxy]).toEqual(true);
	});

	test("Block edit", () => {
		const tx = ctx.newTransaction();
		const inst = tx.update(() => new Sword("address", "cool sword"));

		expect(() => {
			inst.name = "gg";
		}).toThrow();
	});

	test("Edit thru function", () => {
		const tx = ctx.newTransaction();
		const inst = tx.update(() => new Sword("address", "cool sword"));
		tx.update(() => inst.changeName("gg"));
		expect(inst.name).toEqual("gg");
		expect(tx.outputs.length).toEqual(2);
		tx.publish();
	});

	test("Ctx", () => {
		expect(ctx.wallet.address.toString()).toEqual("mzBJZHMC95f4AiYqxaX94VY7ULFwHNfwbZ");
	});
});
