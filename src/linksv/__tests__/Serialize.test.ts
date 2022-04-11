import { Tx } from "bsv";
import { Link, LinkSv, LinkTransaction } from "..";
import { prepare } from "./Prepare.notest";
import { Sword } from "./Sword.notest";

describe("Serialize", () => {
	test("Should serialize", async () => {
		const { tx, ctx } = prepare({ serialUntracked: true });
		const inst = tx.update(() => new Sword("cool sword"));
		expect(inst.location).toBeFalsy();
		const str = ctx.serialize(inst);
		const res: Sword = await ctx.deserialize(str, tx);
		await tx.publish();
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");
		expect(res.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_2");
	});

	test("Should export unwritten state", async () => {
		const { tx, ctx } = prepare();
		const inst = tx.update(() => new Sword("cool sword"));
		await tx.publish();
		expect(inst.location).toBeTruthy();
		const tx2 = new LinkTransaction();
		tx2.update(() => inst.changeName("new name"));
		expect(inst.nonce).toBe(1);
		const str = tx2.export();
		tx2.rollback();
		const res: LinkTransaction = await ctx.import(str);
		expect(res.outputs[0]).toBeInstanceOf(Sword);
		expect((res.outputs[0] as Sword).name).toBe("new name");
		expect(inst.nonce).toBe(1);
		expect(res.outputs[0].nonce).toBe(1);
		expect(inst.name).toBe("new name");
		await res.publish();
		expect(inst.location).toBe(res.outputs[0].location);
		expect(inst.nonce).toBe(2);
		expect(res.outputs[0].nonce).toBe(2);
	});

	test("Should export with sig pub keys", async () => {
		const { tx, ctx, ctx2, ownerPub, ownerPub2 } = prepare();
		const inst = tx.update(() => new Sword("cool sword"));
		await tx.publish();
		expect(inst.location).toBeTruthy();

		ctx2.activate();
		const tx2 = new LinkTransaction();
		tx2.update(() => inst.changeName("new name"));
		await tx2.pay();
		tx2.sign();
		const hex = tx2.exportHex([ownerPub]);

		const rawTx = Tx.fromHex(hex);
		expect(rawTx.txIns[0].script.chunks[0].buf).toBeFalsy();
		expect(rawTx.txIns[0].script.chunks[0].opCodeNum).toBe(0);
		expect(rawTx.txIns[0].script.chunks[1].buf.compare(ownerPub.toBuffer())).toBe(0);
		expect(rawTx.txIns[1].script.chunks[0].buf.length).toBeTruthy();
	});
});
