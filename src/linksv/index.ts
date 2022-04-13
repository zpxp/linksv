// everything in this file is public outside the lib

export { linkExternal } from "./InstanceProxy";
export { LinkContext } from "./LinkContext";
export { LinkTransaction, LinkRecord } from "./LinkTransaction";
export { ChainClass } from "./ChainClass";
export { LinkTemplate } from "./LinkTemplate";
export { Link, LINK_DUST } from "./Link";
export type { ILinkClass, ILink } from "./Link";
export type { ICompression } from "./ICompression";
export { ZLibCompression } from "./compression/ZLibCompression";
export { EciesCompression } from "./compression/EciesCompression";
export { NoCompression } from "./compression/NoCompression";
export { Group } from "./Group";
export type { IApiProvider, Utxo } from "./IApiProvider";
export type { ILinkProvider, ProviderData } from "./ILinkProvider";
export type { IUtxoStore } from "./IUtxoStore";
export { WhatsOnChainApi } from "./apis/WhatsOnChain";
export { IndexedDbUtxoStore } from "./utxostores/IndexedDbUtxoStore";
export { MockUtxoStore } from "./utxostores/MockUtxoStore";
export { MockApi } from "./apis/MockApi";
export { BackendLinkProvider } from "./providers/BackendLinkProvider";
export { MockProvider } from "./providers/MockProvider";
export { LinkSv } from "./Constants";
export { deepCopy } from "./Utils";

import { Address, Bn, KeyPair, Script, TxBuilder, Tx, Bw, Hash, OpCode } from "bsv";

// bsv bug patching here

Tx.prototype.hashPrevouts = function hashPrevouts(this: Tx) {
	const bw = new Bw();
	for (const txIn of this.txIns) {
		bw.write(txIn.txHashBuf); // outpoint (1/2)
		bw.writeUInt32LE(txIn.txOutNum); // outpoint (2/2)
	}
	return Hash.sha256Sha256(bw.toBuffer());
};

Tx.prototype.hashSequence = function hashSequence() {
	const bw = new Bw();
	for (const txIn of this.txIns) {
		bw.writeUInt32LE(txIn.nSequence);
	}
	return Hash.sha256Sha256(bw.toBuffer());
};

Tx.prototype.hashOutputs = function hashOutputs() {
	const bw = new Bw();
	for (const txOut of this.txOuts) {
		bw.write(txOut.toBuffer());
	}
	return Hash.sha256Sha256(bw.toBuffer());
};

Script.prototype.fromPubKeys = function fromPubKeys(m, pubKeys, sort = true) {
	if (typeof m !== "number") {
		throw new Error("m must be a number");
	}
	if (sort === true) {
		pubKeys = Script.sortPubKeys(pubKeys);
	}
	this.writeOpCode(m + OpCode.OP_1 - 1);
	for (const key of pubKeys) {
		this.writeBuffer(key.toBuffer());
	}
	this.writeOpCode(pubKeys.length + OpCode.OP_1 - 1);
	this.writeOpCode(OpCode.OP_CHECKMULTISIG);
	return this;
};

// fix bugs here
TxBuilder.prototype.signWithKeyPairs = function signWithKeyPairs(this: TxBuilder, keyPairs) {
	// produce map of addresses to private keys
	const addressStrMap: { [s: string]: KeyPair } = {};
	for (const keyPair of keyPairs) {
		const addressStr = Address.fromPubKey(keyPair.pubKey).toString();
		addressStrMap[addressStr] = keyPair;
	}
	// loop through all inputs
	for (let nIn = 0; nIn < this.tx.txIns.length; nIn++) {
		const txIn = this.tx.txIns[nIn];
		// for each input, use sigOperations to get list of signatures and pubkeys
		// to be produced and inserted
		const arr = this.sigOperations.get(txIn.txHashBuf, txIn.txOutNum);
		for (const obj of arr) {
			// for each pubkey, get the privkey from the privkey map and sign the input
			const { nScriptChunk, type, addressStr, nHashType } = obj;
			const keyPair = addressStrMap[addressStr];
			if (!keyPair) {
				obj.log = `cannot find keyPair for addressStr ${addressStr}`;
				continue;
			}

			const txOut = this.uTxOutMap.get(txIn.txHashBuf, txIn.txOutNum);
			const lastOpcode = txOut.script.chunks[txOut.script.chunks.length - 1].opCodeNum;
			if (lastOpcode === OpCode.OP_CHECKMULTISIG || lastOpcode === OpCode.OP_CHECKMULTISIGVERIFY) {
				const requiredSigs = txOut.script.chunks[0].opCodeNum - 80;
				if (txIn.script.chunks.length > requiredSigs) {
					// already signed
					continue;
				}
				if (!txIn.script.chunks.length) {
					// leading zero
					txIn.script.chunks.splice(0, 0, { opCodeNum: OpCode.OP_0 });
				}
				// add blank chunk to insert sig
				txIn.script.chunks.splice(nScriptChunk, 0, { opCodeNum: 0 });
			}

			const sigBuff = txIn.script.chunks[nScriptChunk].buf;
			if (sigBuff?.byteLength && Buffer.compare(sigBuff, Buffer.alloc(sigBuff.length, 0)) !== 0) {
				// already signed
				continue;
			}

			if (type === "sig") {
				this.signTxIn(nIn, keyPair, txOut, nScriptChunk, nHashType);
				obj.log = "successfully inserted signature";
			} else if (type === "pubKey") {
				txIn.script.chunks[nScriptChunk] = new Script().writeBuffer(keyPair.pubKey.toBuffer()).chunks[0];
				txIn.setScript(txIn.script);
				obj.log = "successfully inserted public key";
			} else {
				obj.log = `cannot perform operation of type ${type}`;
				continue;
			}
		}
	}
	return this;
};

TxBuilder.prototype.estimateSize = function estimateSize() {
	// largest possible sig size. final 1 is for pushdata at start. second to
	// final is sighash byte. the rest are DER encoding.
	const sigSize = 1 + 1 + 1 + 1 + 32 + 1 + 1 + 32 + 1 + 1;
	// length of script, y odd, x value - assumes compressed public key
	const pubKeySize = 1 + 1 + 33;

	let size = this.tx.toBuffer().length;

	this.tx.txIns.forEach(txIn => {
		const { txHashBuf, txOutNum } = txIn;
		const sigOperations = this.sigOperations.get(txHashBuf, txOutNum);
		sigOperations.forEach(obj => {
			const { nScriptChunk, type } = obj;
			if (txIn.script.chunks.length > 0 && txIn.script.chunks.length > nScriptChunk) {
				const script = new Script([txIn.script.chunks[nScriptChunk]]);
				const scriptSize = script.toBuffer().length;
				size -= scriptSize;
			}
			if (type === "sig") {
				size += sigSize;
			} else if (obj.type === "pubKey") {
				size += pubKeySize;
			} else {
				throw new Error("unsupported sig operations type");
			}
		});
	});

	// size = size + sigSize * this.tx.txIns.length
	size = size + 1; // assume txInsVi increases by 1 byte
	return Math.round(size);
};

TxBuilder.prototype.estimateSize = function estimateSize() {
	// largest possible sig size. final 1 is for pushdata at start. second to
	// final is sighash byte. the rest are DER encoding.
	const sigSize = 1 + 1 + 1 + 1 + 32 + 1 + 1 + 32 + 1 + 1;
	// length of script, y odd, x value - assumes compressed public key
	const pubKeySize = 1 + 1 + 33;

	let size = this.tx.toBuffer().length;

	if (!this.tx.txIns.length) {
		// estimate size of single input
		size += 300;
	}

	for (const txIn of this.tx.txIns) {
		const { txHashBuf, txOutNum } = txIn;
		const sigOperations = this.sigOperations.get(txHashBuf, txOutNum);
		for (const sig of sigOperations) {
			const { nScriptChunk, type } = sig;
			if (txIn.script.chunks.length > 0 && txIn.script.chunks.length > nScriptChunk) {
				const script = new Script([txIn.script.chunks[nScriptChunk]]);
				const scriptSize = script.toBuffer().length;
				size -= scriptSize;
			}
			if (type === "sig") {
				size += sigSize;
			} else if (sig.type === "pubKey") {
				size += pubKeySize;
			} else {
				throw new Error("unsupported sig operations type");
			}
		}
	}
	// size = size + sigSize * this.tx.txIns.length
	size = size + 1; // assume txInsVi increases by 1 byte
	return Math.round(size);
};
