import { Link, LinkTransaction, LinkSv, LinkTemplate } from "..";
import { MockApi } from "../apis/MockApi";
import { LINK_DUST } from "../Link";
import { prepare } from "./Prepare.notest";
import { Sword } from "./Sword.notest";
import fs from "fs";
import { FileLink } from "../FileLink";

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

@LinkTemplate("LinkWithBuffer")
class LinkWithBuffer extends Link {
	constructor(public file: Buffer) {
		super();
	}
}

@LinkTemplate("AppLink")
class AppLink extends Link {
	constructor(public file: FileLink, public name: string) {
		super();
	}

	changeName(name: string) {
		this.name = name;
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

		const inst = tx.update(() => new LinkWithFile(new File([filebuf], "myimage.png", { type: "image/png" })));
		expect(inst).toBeInstanceOf(Link);
		expect(inst.file.size).toBeGreaterThan(10);
		expect(inst.file.name).toBe("myimage.png");
		expect(inst.file.type).toBe("image/png");
		const txid = await tx.publish();
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");
		const { json, files } = await ctx.getRawChainData(txid);
		expect(json).toBe('{"i":[-1],"o":[{"file":{"$file":0,"name":"myimage.png","type":"image/png"},"nonce":1}]}');
		expect(files.length).toBe(1);

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

	test("Should read and write buffer to chain", async () => {
		const { tx, ctx, ctx2 } = prepare();
		const filebuf = await loadFile();

		const inst = tx.update(() => new LinkWithBuffer(filebuf));
		expect(inst).toBeInstanceOf(Link);
		expect(inst.file.length).toBeGreaterThan(10);
		const txid = await tx.publish();
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");
		ctx.purge(inst);

		const { json, files } = await ctx.getRawChainData(txid);
		expect(json).toBe('{"i":[-1],"o":[{"file":{"$buf":0},"nonce":1}]}');
		expect(files.length).toBe(1);

		const loaded = await ctx.load(LinkWithBuffer, inst.location);
		expect(loaded.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");
		expect(loaded.file.length).toBe(inst.file.length);
	});

	test("Should read file from chain using FileLink", async () => {
		let { tx, ctx, ctx2 } = prepare();
		const filebuf = await loadFile();

		const inst = tx.update(() => new FileLink(new File([filebuf], "myimage.png", { type: "image/png" })));
		expect(inst).toBeInstanceOf(Link);
		expect(inst.file.size).toBeGreaterThan(10);
		expect(inst.file.name).toBe("myimage.png");
		expect(inst.file.type).toBe("image/png");
		await tx.publish();
		expect(inst.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");

		tx = new LinkTransaction();
		tx.update(() => new AppLink(inst, "name"));
		const txid = await tx.publish();
		const { json, files } = await ctx.getRawChainData(txid);
		// should record it as a pointer
		expect(json).toBe(
			'{"i":[-1],"o":[{"file":{"$":"0000000000000000000000000000000000000000000000000000000000000001_1","t":"__FileLink"},"name":"name","nonce":1}]}'
		);
		expect(files.length).toBe(0);

		ctx.purge(inst);

		const loaded = await ctx.load(FileLink, inst.location);
		expect(loaded.location).toBe("0000000000000000000000000000000000000000000000000000000000000001_1");
		expect(loaded.file.name).toBe(inst.file.name);
		expect(loaded.file.size).toBe(inst.file.size);
		expect(loaded.file.type).toBe(inst.file.type);
	});
});
