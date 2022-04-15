import { Link, LinkTransaction, LinkSv, LinkTemplate } from "..";
import { MockApi } from "../apis/MockApi";
import { LINK_DUST } from "../Link";
import { prepare } from "./Prepare.notest";
import { Sword } from "./Sword.notest";
import fs from "fs";

function loadFile() {
	return new Promise<Buffer>(resolve => {
		fs.readFile("src/linksv/__tests__/image.png", "binary", (err, data) => {
			expect(err).toBeFalsy();
			resolve(Buffer.from(data));
		});
	});
}

@LinkTemplate("LinkWithFile")
class LinkWithFile extends Link {
	constructor(public file: File) {
		super();
	}
}

describe("Files", () => {
	test("Should be instance of file and link", async () => {
		const { tx, ctx, ctx2 } = prepare();
		const filebuf = await loadFile();

		const inst = tx.update(() => new LinkWithFile(new File([filebuf], "image.png", { type: "image/png" })));
		expect(inst).toBeInstanceOf(Link);
		expect(inst.file.size).toBeGreaterThan(10);
		expect(inst.file.name).toBe("image.png");
		expect(inst.isDestroyed).toBe(false);
		const txid = await tx.publish();
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");
	});

	test("Should read file from chain", async () => {
		const { tx, ctx, ctx2 } = prepare();
		const filebuf = await loadFile();

		const inst = tx.update(() => new LinkWithFile(new File([filebuf], "image.png", { type: "image/png" })));
		expect(inst).toBeInstanceOf(Link);
		expect(inst.file.size).toBeGreaterThan(10);
		expect(inst.file.name).toBe("image.png");
		expect(inst.file.type).toBe("image/png");
		const txid = await tx.publish();
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");
		ctx.purge(inst);

		const loaded = await ctx.load(LinkWithFile, inst.location);
		expect(loaded.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");
		expect(loaded.file.name).toBe(inst.file.name);
		expect(loaded.file.size).toBe(inst.file.size);
		expect(loaded.file.type).toBe(inst.file.type);
	});

	test("Should read file from chain with no app name", async () => {
		const { tx, ctx, ctx2 } = prepare({ appName: "" });
		const filebuf = await loadFile();

		const inst = tx.update(() => new LinkWithFile(new File([filebuf], "image.png", { type: "image/png" })));
		expect(inst).toBeInstanceOf(Link);
		expect(inst.file.size).toBeGreaterThan(10);
		expect(inst.file.name).toBe("image.png");
		expect(inst.file.type).toBe("image/png");
		const txid = await tx.publish();
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");
		ctx.purge(inst);

		const loaded = await ctx.load(LinkWithFile, inst.location);
		expect(loaded.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");
		expect(loaded.file.name).toBe(inst.file.name);
		expect(loaded.file.size).toBe(inst.file.size);
		expect(loaded.file.type).toBe(inst.file.type);
	});
});
