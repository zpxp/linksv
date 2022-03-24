import { Link, LinkSv } from "..";
import { prepare } from "./Prepare.notest";
import { Sword } from "./Sword.notest";



describe("link", () => {
	test("Should resolve", () => {
		expect(Link).toEqual(expect.anything());
	});

	test("Should Construct", () => {
		const { tx } = prepare();
		const inst = tx.update(() => new Sword("cool sword"));
		expect(inst).toEqual(expect.anything());
	});

	test("Is Proxy", () => {
		const { tx } = prepare();
		const inst = tx.update(() => new Sword("cool sword"));
		const isProx = inst[LinkSv.IsProxy];
		expect(isProx).toEqual(true);
	});

	test("Block edit", () => {
		const { tx } = prepare();
		const inst = tx.update(() => new Sword("cool sword"));

		expect(() => {
			inst.name = "gg";
		}).toThrow();
	});

	test("Edit thru function", async () => {
		const { tx } = prepare();
		const inst = tx.update(() => new Sword("cool sword"));
		tx.update(() => inst.changeName("gg"));
		expect(inst.name).toEqual("gg");
		expect(tx.outputs.length).toEqual(1);
		const txid = await tx.publish();
		expect(txid).toEqual("0000000000000000000000000000000000000000000000000000000000000001");
	});

	test("Ctx", () => {
		const { ctx, ownerAddr } = prepare();
		expect(ctx.owner.address.toString()).toEqual(ownerAddr.toString());
	});
});
