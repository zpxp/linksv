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
	logger: console,
	provider: new BackendLinkProvider("https://<your_provider_host_url>[:port]"),
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

You will need to run a provider backend to store link locations. Clone this repo onto your server and run:

``` bash
mkdir .data
sudo chown -R 5678 .data
docker-compose up -d --build --force-recreate
```

This will run a instance of the provider backend and store the links in a sqlite database located in `.data/link.db`.
If you wish to use a database other than sqlite, you may change the `UseSqlite` in `builder.Services.AddDbContext` - `src/provider/Program.cs` to another provider. You may need to install the nuget packages for your relevant database. See [ef core database providers](https://docs.microsoft.com/en-us/ef/core/providers/?tabs=dotnet-core-cli). After setting up the backend, point your client's link provider to it when creating the `LinkContext`.