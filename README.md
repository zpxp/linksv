# Link SV

A Bitcoin SV (BSV) data protocol for writing seamless chain reads, writes and updates. Write any arbitrary javascript class value to the blockchain and easily update it.

``` ts
import { PrivKey, Address, PubKey } from "bsv";
import { LinkTemplate, Link, LinkTransaction } from "linksv";

const pursePk = PrivKey.fromRandom();
const ownerPk = PrivKey.fromRandom();
const ownerAddr = Address.fromPubKey(PubKey.fromPrivKey(ownerPk));

const ctx = new LinkContext({
	purse: pursePk.toString(),
	owner: ownerPk.toString(),
	app: "appName",
});

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

const tx = new LinkTransaction()
const swordInstance = tx.update(() => new Sword("cool sword"));
tx.update(() => swordInstance.changeName("gg"));
expect(swordInstance.name).toEqual("gg");
expect(swordInstance.owner).toEqual(ownerAddr);
expect(tx.outputs.length).toEqual(1);
const txid = await tx.publish();
console.log(swordInstance.location);

```

To load a location from chain:

```ts
const swordInstance = await ctx.load(Sword, locationToLoadStr);
```