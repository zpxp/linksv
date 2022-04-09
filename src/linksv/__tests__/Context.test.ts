import { ChainClass, Link, LinkSv, LinkTemplate, LinkTransaction } from "..";
import { prepare } from "./Prepare.notest";
import { Sword } from "./Sword.notest";

describe("Context", () => {
	test("Should get purse utxos", async () => {
		const { ctx } = prepare();
		let bn = await ctx.getPurseBalance();
		expect(bn.toNumber()).toBe(100000110);
		bn = await ctx.getPurseBalance();
		expect(bn.toNumber()).toBe(100000110);
	});
});
