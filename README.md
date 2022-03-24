# Link SV

A Bitcoin SV (BSV) data protocol for effortless reads, writes and updates. Write any arbitrary javascript class value to the blockchain and easily update it, leaving an immutable audit trail.

## Installation

```
npm install linksv axios axios-rate-limit axios-retry bsv pako dexie
```
Or
```
yarn add linksv axios axios-rate-limit axios-retry bsv pako dexie
```

If using in the browser also add `crypto-js` and `buffer` npm packages and modify your webpack config like below:

```js
module.exports = {
	...
	resolve: {
		alias:{
			bsv: require.resolve("bsv/dist/bsv.bundle"),
		},
		fallback: {
			crypto: require.resolve("crypto-js"),
			buffer: require.resolve("buffer/")
		}
	},
	...
	plugins: [
		...
		new webpack.ProvidePlugin({
			process: "process/browser",
			Buffer: ["buffer", "Buffer"]
		})
	]
}
```

## Use

``` ts
import { PrivKey, Address, PubKey } from "bsv";
import { LinkTemplate, Link, LinkTransaction } from "linksv";

// uncomment to use testnet
// bsv.Constants.Default = bsv.Constants.Testnet;

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

To give a template an owner, requiring that owner to sign whenever a new instance of a link in constructed, call `tx.deploy(LinkClass, ownerAddrStr)` then `tx.publish()`. See [template owner tests](src/linksv/__tests__/TemplateOwner.test.ts) for more info.

## Backend

You will need to run a provider backend to store link locations. Clone this repo onto your server and run:

``` bash
mkdir .data
sudo chown -R 5678 .data
docker-compose up -d --build --force-recreate
```

This will run a instance of the provider backend and store the links in a sqlite database located in `.data/link.db`.
If you wish to use a database other than sqlite, you may change the `UseSqlite` in `builder.Services.AddDbContext` - `src/provider/Program.cs` to another provider. You may need to install the nuget packages for your relevant database. See [ef core database providers](https://docs.microsoft.com/en-us/ef/core/providers/?tabs=dotnet-core-cli). After setting up the backend, point your client's link provider to it when creating the `LinkContext`.

### Swagger
To see what endpoints are provided by the backend, run in debug mode and visit the url [http://localhost:5000/swagger/index.html](http://localhost:5000/swagger/index.html). 

## How it works
Link SV tracks changes to link instances and serializes those changes to chain on `tx.publish()`. Data is compressed so large amounts of data can be written while maintaining cheap transaction fees. New link locations are automatically recorded in the backend provider so blockchain indexing is not required.

## Note
Node js users will need to replace the `LinkContext.utxoStore` with a node compatible store. It currently defaults to `IndexedDbUtxoStore` which only works in browser contexts. You can run an in memory only store by using `MockUtxoStore` instead.