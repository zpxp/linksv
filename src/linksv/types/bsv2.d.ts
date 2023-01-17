declare module 'bsv/ach' {
  /// <reference types="node" />
  export class Ach {
      static encrypt(messageBuf: Buffer, cipherKeyBuf: Buffer, ivBuf?: Buffer): Buffer;
      static asyncEncrypt(messageBuf: Buffer, cipherKeyBuf: Buffer, ivBuf?: Buffer): Promise<Buffer>;
      static decrypt(encBuf: Buffer, cipherKeyBuf: Buffer): Buffer;
      static asyncDecrypt(encBuf: Buffer, cipherKeyBuf: Buffer): Promise<Buffer>;
  }
  //# sourceMappingURL=ach.d.ts.map
}
declare module 'bsv/ach.d.ts' {
}
declare module 'bsv/address' {
  /// <reference types="node" />
  import { NetworkConstants } from 'bsv/constants';
  import { PrivKey } from 'bsv/priv-key';
  import { PubKey } from 'bsv/pub-key';
  import { Script } from 'bsv/script';
  import { Struct } from 'bsv/struct';
  interface AddressLike {
      versionByteNum: number;
      hashBuf: string;
  }
  export class Address extends Struct {
      versionByteNum: number;
      hashBuf: Buffer;
      Constants: NetworkConstants['Address'];
      constructor(versionByteNum?: number, hashBuf?: Buffer, constants?: NetworkConstants['Address']);
      fromBuffer(buf: Buffer): this;
      fromPubKeyHashBuf(hashBuf: Buffer): this;
      static fromPubKeyHashBuf(hashBuf: Buffer): Address;
      fromPubKey(pubKey: PubKey): this;
      static fromPubKey(pubKey: PubKey): Address;
      asyncFromPubKey(pubKey: PubKey): Promise<this>;
      static asyncFromPubKey(pubKey: PubKey): Promise<Address>;
      fromPrivKey(privKey: PrivKey): this;
      static fromPrivKey(privKey: any): Address;
      asyncFromPrivKey(privKey: PrivKey): Promise<this>;
      static asyncFromPrivKey(privKey: PrivKey): Promise<Address>;
      fromRandom(): this;
      static fromRandom(): Address;
      asyncFromRandom(): Promise<this>;
      static asyncFromRandom(): Promise<Address>;
      fromString(str: string): this;
      asyncFromString(str: string): Promise<this>;
      static isValid(addrstr: string): boolean;
      isValid(): boolean;
      toTxOutScript(): Script;
      fromTxInScript(script: Script): this;
      static fromTxInScript(script: Script): Address;
      fromTxOutScript(script: Script): this;
      static fromTxOutScript(script: Script): Address;
      toBuffer(): Buffer;
      toJSON(): AddressLike;
      fromJSON(json: AddressLike): this;
      toString(): string;
      asyncToString(): Promise<string>;
      validate(): this;
      static Mainnet: typeof Address;
      static Testnet: typeof Address;
  }
  export {};
  //# sourceMappingURL=address.d.ts.map
}
declare module 'bsv/address.d.ts' {
 
}
declare module 'bsv/aes' {
  /// <reference types="node" />
  export class Aes {
      static encrypt(messageBuf: Buffer, keyBuf: Buffer): Buffer;
      static decrypt(encBuf: Buffer, keyBuf: Buffer): Buffer;
      static buf2Words(buf: Buffer): number[];
      static words2Buf(words: number[]): Buffer;
  }
  //# sourceMappingURL=aes.d.ts.map
}
declare module 'bsv/aes.d.ts' {
 
}
declare module 'bsv/aescbc' {
  /// <reference types="node" />
  export class Aescbc {
      static encrypt(messageBuf: Buffer, cipherKeyBuf: Buffer, ivBuf: Buffer, concatIvBuf?: boolean): Buffer;
      static decrypt(encBuf: Buffer, cipherKeyBuf: Buffer, ivBuf?: Buffer): Buffer;
  }
  //# sourceMappingURL=aescbc.d.ts.map
}
declare module 'bsv/aescbc.d.ts' {
 
}
declare module 'bsv/base-58-check' {
  /// <reference types="node" />
  import { Struct } from 'bsv/struct';
  export class Base58Check extends Struct {
      buf: Buffer;
      constructor(buf?: Buffer);
      fromHex(hex: string): this;
      toHex(): string;
      static decode(s: string): Buffer;
      static encode(buf: Buffer): string;
      fromBuffer(buf: Buffer): this;
      fromString(str: string): this;
      toBuffer(): Buffer;
      toString(): string;
  }
  //# sourceMappingURL=base-58-check.d.ts.map
}
declare module 'bsv/base-58-check.d.ts' {
 
}
declare module 'bsv/base-58' {
  /// <reference types="node" />
  import { Struct } from 'bsv/struct';
  export class Base58 extends Struct {
      buf: Buffer;
      constructor(buf?: Buffer);
      fromHex(hex: string): this;
      toHex(): string;
      static encode(buf: Buffer): string;
      static decode(str: string): Buffer;
      fromBuffer(buf: Buffer): this;
      fromString(str: string): this;
      toBuffer(): Buffer;
      toString(): string;
  }
  //# sourceMappingURL=base-58.d.ts.map
}
declare module 'bsv/base-58.d.ts' {
 
}
declare module 'bsv/bip-32' {
  /// <reference types="node" />
  import { NetworkConstants } from 'bsv/constants';
  import { PrivKey as PrivKeyClass } from 'bsv/priv-key';
  import { PubKey } from 'bsv/pub-key';
  import { Struct } from 'bsv/struct';
  export class Bip32 extends Struct {
      versionBytesNum: number;
      depth: number;
      parentFingerPrint: Buffer;
      childIndex: number;
      chainCode: Buffer;
      privKey: PrivKeyClass;
      pubKey: PubKey;
      Constants: NetworkConstants['Bip32'];
      PrivKey: typeof PrivKeyClass;
      constructor(versionBytesNum?: number, depth?: number, parentFingerPrint?: Buffer, childIndex?: number, chainCode?: Buffer, privKey?: PrivKeyClass, pubKey?: PubKey, constants?: NetworkConstants['Bip32'], PrivKey?: typeof PrivKeyClass);
      fromRandom(): this;
      static fromRandom(): Bip32;
      fromString(str: string): this;
      /**
       * Use workers to convert a bip32 string into a bip32 object without
       * blocking.
       */
      asyncFromString(str: string): Promise<this>;
      fromSeed(bytes: Buffer): this;
      static fromSeed(bytes: Buffer): Bip32;
      asyncFromSeed(bytes: Buffer): Promise<this>;
      static asyncFromSeed(bytes: Buffer): Promise<Bip32>;
      fromBuffer(buf: Buffer): this;
      /**
       * This is a faster version of .fromBuffer that reads in the output from
       * .toFastBuffer rather than from .toBuffer. .toFastBuffer outputs almost the
       * same thing as .toBuffer, except the public key is uncompressed. That makes
       * it larger, but also means that point multiplication doesn't have to be
       * used to derive the y value. So reading it in is faster. The only thing we
       * have to do is explicitely set the "compressed" value of public key to true
       * after reading it in. That is because although .toFastBuffer and
       * .fromFastBuffer transmit the public key in uncompressed form, we want it
       * to be set to compressed when stored in memory.
       */
      fromFastBuffer(buf: Buffer): this;
      derive(path: string): Bip32;
      asyncDerive(path: string): Promise<Bip32>;
      deriveChild(i: number): Bip32;
      toPublic(): Bip32;
      toBuffer(): Buffer;
      /**
       * This is the "fast" analog of toBuffer. It is almost the same as toBuffer,
       * and in fact is actually not any faster. The only difference is that it
       * adds an uncompressed rather than compressed public key to the output. This
       * is so that .fromFastBufer can read in the public key without having to do
       * fancy, slow point multiplication to derive the y value of the public key.
       * Thus, although .toFastBuffer is not any faster, .fromFastBuffer is faster.
       */
      toFastBuffer(): Buffer;
      toString(): string;
      /**
       * Use workers to convert a bip32 object into a bip32 string without
       * blocking.
       */
      asyncToString(): Promise<string>;
      toJSON(): string;
      fromJSON(json: string): this;
      isPrivate(): boolean;
      static Mainnet: typeof Bip32;
      static Testnet: typeof Bip32;
  }
  //# sourceMappingURL=bip-32.d.ts.map
}
declare module 'bsv/bip-32.d.ts' {
 
}
declare module 'bsv/bip-39-en-wordlist' {
  export const wordList: {
      value: string[];
      space: string;
  };
  //# sourceMappingURL=bip-39-en-wordlist.d.ts.map
}
declare module 'bsv/bip-39-en-wordlist.d.ts' {
 
}
declare module 'bsv/bip-39-en' {
  /// <reference types="node" />
  import { Bip39 } from 'bsv/bip-39';
  export class Bip39En extends Bip39 {
      constructor(mnemonic?: string, seed?: Buffer);
  }
  //# sourceMappingURL=bip-39-en.d.ts.map
}
declare module 'bsv/bip-39-en.d.ts' {
 
}
declare module 'bsv/bip-39-jp-wordlist' {
  export const wordList: {
      value: string[];
      space: string;
  };
  //# sourceMappingURL=bip-39-jp-wordlist.d.ts.map
}
declare module 'bsv/bip-39-jp-wordlist.d.ts' {
 
}
declare module 'bsv/bip-39-jp' {
  /// <reference types="node" />
  import { Bip39 } from 'bsv/bip-39';
  export class Bip39Jp extends Bip39 {
      constructor(mnemonic?: string, seed?: Buffer);
  }
  //# sourceMappingURL=bip-39-jp.d.ts.map
}
declare module 'bsv/bip-39-jp.d.ts' {
 
}
declare module 'bsv/bip-39-words' {
  import { wordList as enWordlist } from 'bsv/bip-39-en-wordlist';
  import { wordList as jpWordlist } from 'bsv/bip-39-jp-wordlist';
  export { enWordlist as en, jpWordlist as jp };
  //# sourceMappingURL=bip-39-words.d.ts.map
}
declare module 'bsv/bip-39-words.d.ts' {
 
}
declare module 'bsv/bip-39' {
  /// <reference types="node" />
  import { Br } from 'bsv/br';
  import { Bw } from 'bsv/bw';
  import { Struct } from 'bsv/struct';
  export class Bip39 extends Struct {
      mnemonic: string;
      seed: Buffer;
      Wordlist: {
          value: string[];
          space: string;
      };
      constructor(mnemonic?: string, seed?: Buffer, wordlist?: {
          value: string[];
          space: string;
      });
      toBw(bw?: Bw): Bw;
      fromBr(br: Br): this;
      /**
       * Generate a random new mnemonic from the wordlist.
       */
      fromRandom(bits?: number): this;
      static fromRandom(bits?: number): Bip39;
      asyncFromRandom(bits?: number): Promise<this>;
      static asyncFromRandom(bits?: number): Promise<Bip39>;
      fromEntropy(buf: Buffer): this;
      static fromEntropy(buf: Buffer): Bip39;
      asyncFromEntropy(buf: Buffer): Promise<this>;
      static asyncFromEntropy(buf: Buffer): Promise<Bip39>;
      fromString(mnemonic: string): this;
      toString(): string;
      toSeed(passphrase?: string): Buffer;
      asyncToSeed(passphrase?: string): Promise<Buffer>;
      /**
       * Generate a new mnemonic from some entropy generated somewhere else. The
       * entropy must be at least 128 bits.
       */
      entropy2Mnemonic(buf: Buffer): this;
      /**
       * Check that a mnemonic is valid. This means there should be no superfluous
       * whitespace, no invalid words, and the checksum should match.
       */
      check(): boolean;
      /**
       * Convert a mnemonic to a seed. Does not check for validity of the mnemonic -
       * for that, you should manually run check() first.
       */
      mnemonic2Seed(passphrase?: string): this;
      isValid(passphrase?: string): boolean;
      static isValid(mnemonic: string, passphrase?: string): boolean;
  }
  //# sourceMappingURL=bip-39.d.ts.map
}
declare module 'bsv/bip-39.d.ts' {
 
}
declare module 'bsv/block-header' {
  /// <reference types="node" />
  /**
   * Block Header
   * ============
   *
   * Every block contains a blockHeader. This is probably not something you will
   * personally use, but it's here if you need it.
   */
  import { Br } from 'bsv/br';
  import { Bw } from 'bsv/bw';
  import { Struct } from 'bsv/struct';
  export interface BlockHeaderLike {
      versionBytesNum: number;
      prevBlockHashBuf: string;
      merkleRootBuf: string;
      time: number;
      bits: number;
      nonce: number;
  }
  export class BlockHeader extends Struct {
      versionBytesNum: number;
      prevBlockHashBuf: Buffer;
      merkleRootBuf: Buffer;
      time: number;
      bits: number;
      nonce: number;
      constructor(versionBytesNum?: number, prevBlockHashBuf?: Buffer, merkleRootBuf?: Buffer, time?: number, bits?: number, nonce?: number);
      fromJSON(json: BlockHeaderLike): this;
      toJSON(): BlockHeaderLike;
      fromBr(br: Br): this;
      toBw(bw?: Bw): Bw;
  }
  //# sourceMappingURL=block-header.d.ts.map
}
declare module 'bsv/block-header.d.ts' {
 
}
declare module 'bsv/block' {
  /// <reference types="node" />
  /**
   * Block
   * =====
   *
   * A block, of course, is a collection of transactions. This class is somewhat
   * incompconste at the moment. In the future, it should support the ability to
   * check to see if a transaction is in a block (thanks to the magic of merkle
   * trees). You will probably never use Yours Bitcoin to create a block, since almost
   * everyone will use bitcoind for that. As such, the primary way to use this is
   * new Block().fromBuffer(buf), which will parse the block and prepare its insides
   * for you to inspect.
   */
  import { BlockHeader, BlockHeaderLike } from 'bsv/block-header';
  import { Br } from 'bsv/br';
  import { Bw } from 'bsv/bw';
  import { Struct } from 'bsv/struct';
  import { Tx, TxLike } from 'bsv/tx';
  import { VarInt } from 'bsv/var-int';
  export interface BlockLike {
      blockHeader: BlockHeaderLike;
      txsVi: string;
      txs: TxLike[];
  }
  export class Block extends Struct {
      static readonly MAX_BLOCK_SIZE = 1000000;
      blockHeader: BlockHeader;
      txsVi: VarInt;
      txs: Tx[];
      constructor(blockHeader?: BlockHeader, txsVi?: VarInt, txs?: Tx[]);
      fromJSON(json: BlockLike): this;
      toJSON(): BlockLike;
      fromBr(br: Br): this;
      toBw(bw?: Bw): Bw;
      hash(): Buffer;
      asyncHash(): Promise<Buffer>;
      id(): string;
      asyncId(): Promise<string>;
      verifyMerkleRoot(): number;
      /**
       * Sometimes we don't want to parse an entire block into memory. Instead, we
       * simply want to iterate through all transactions in the block. That is what
       * this method is for. This method returns an efficient iterator which can be
       * used in a `for (tx of txs)` construct that returns each tx one at a time
       * without first parsing all of them into memory.
       *
       * @param {Buffer} blockBuf A buffer of a block.
       */
      static iterateTxs(blockBuf: Buffer): {
          blockHeader: BlockHeader;
          txsVi: VarInt;
          txsNum: number;
          [Symbol.iterator](): Generator<Tx, void, unknown>;
      };
  }
  //# sourceMappingURL=block.d.ts.map
}
declare module 'bsv/block.d.ts' {
 
}
declare module 'bsv/bn' {
  /// <reference types="node" />
  /**
   * Use hack to type legacy bn class.
   *
   * TODO: Refactor by properly extending from bn.js.
   */
  type Endianness = 'le' | 'be';
  type IPrimeName = 'k256' | 'p224' | 'p192' | 'p25519';
  interface MPrime {
      name: string;
      p: BnDefinition;
      n: number;
      k: BnDefinition;
  }
  interface ReductionContext {
      m: number;
      prime: MPrime;
      [key: string]: any;
  }
  class BnDefinition {
      static BnLegacy: typeof BnDefinition;
      static wordSize: 26;
      constructor(number?: number | string | number[] | Uint8Array | Buffer | BnDefinition, base?: number | 'hex', endian?: Endianness);
      /**
       * @description  create a reduction context
       */
      static red(reductionContext: BnDefinition | IPrimeName): ReductionContext;
      /**
       * @description  create a reduction context  with the Montgomery trick.
       */
      static mont(num: BnDefinition): ReductionContext;
      /**
       * @description returns true if the supplied object is a BnDefinition.js instance
       */
      static isBnDefinition(b: any): b is BnDefinition;
      /**
       * @description returns the maximum of 2 BnDefinition instances.
       */
      static max(left: BnDefinition, right: BnDefinition): BnDefinition;
      /**
       * @description returns the minimum of 2 BnDefinition instances.
       */
      static min(left: BnDefinition, right: BnDefinition): BnDefinition;
      fromHex(hex: string, opts?: {
          endian: 'big' | 'little';
      }): BnDefinition;
      toHex(opts?: {
          size?: number;
          endian?: 'big' | 'little';
      }): string;
      fromJSON(str: string): BnDefinition;
      fromNumber(n: number): BnDefinition;
      fromString(str: string, base?: number): BnDefinition;
      fromBuffer(buf: Buffer, opts?: {
          endian: 'big' | 'little';
      }): BnDefinition;
      static fromBuffer(buf: Buffer, opts?: {
          endian: 'big' | 'little';
      }): BnDefinition;
      fromFastBuffer(buf: Buffer, opts?: {
          endian: 'big' | 'little';
      }): BnDefinition;
      /**
       * Signed magnitude buffer. Most significant bit represents sign (0 = positive,
       * 1 = negative).
       */
      fromSm(buf: Buffer, opts?: {
          endian: 'big' | 'little';
      }): BnDefinition;
      toSm(opts?: {
          endian: 'big' | 'little';
      }): Buffer;
      /**
       * Produce a BnDefinition from the "bits" value in a blockheader. Analagous to Bitcoin
       * Core's uint256 SetCompact method. bits is assumed to be UInt32.
       */
      fromBits(bits: number, opts?: {
          strict: boolean;
      }): BnDefinition;
      /**
       * Convert BnDefinition to the "bits" value in a blockheader. Analagous to Bitcoin
       * Core's uint256 GetCompact method. bits is a UInt32.
       */
      toBits(): number;
      fromScriptNumBuffer(buf: Buffer, fRequireMinimal?: boolean, nMaxNumSize?: number): BnDefinition;
      toScriptNumBuffer(): Buffer;
      /**
       * @description  clone number
       */
      clone(): BnDefinition;
      /**
       * @description  convert to base-string and pad with zeroes
       */
      toString(base?: number | 'hex', length?: number): string;
      /**
       * @description convert to Javascript Number (limited to 53 bits)
       */
      toNumber(): number;
      /**
       * @description convert to JSON compatible hex string (alias of toString(16))
       */
      toJSON(): string;
      /**
       * @description  convert to byte Array, and optionally zero pad to length, throwing if already exceeding
       */
      toArray(endian?: Endianness, length?: number): number[];
      /**
       * @description convert to an instance of `type`, which must behave like an Array
       */
      toArrayLike(ArrayType: typeof Buffer, endian?: Endianness, length?: number): Buffer;
      toArrayLike(ArrayType: any[], endian?: Endianness, length?: number): any[];
      /**
       * @description  convert to Node.js Buffer (if available). For compatibility with browserify and similar tools, use this instead: a.toArrayLike(Buffer, endian, length)
       */
      toBuffer(opts?: {
          size?: number;
          endian?: 'big' | 'little';
      }): Buffer;
      toFastBuffer(opts?: {
          size?: number;
          endian?: 'big' | 'little';
      }): Buffer;
      /**
       * @description get number of bits occupied
       */
      bitLength(): number;
      /**
       * @description return number of less-significant consequent zero bits (example: 1010000 has 4 zero bits)
       */
      zeroBits(): number;
      /**
       * @description return number of bytes occupied
       */
      byteLength(): number;
      /**
       * @description  true if the number is negative
       */
      isNeg(): boolean;
      /**
       * @description  check if value is even
       */
      isEven(): boolean;
      /**
       * @description   check if value is odd
       */
      isOdd(): boolean;
      /**
       * @description  check if value is zero
       */
      isZero(): boolean;
      /**
       * @description compare numbers and return `-1 (a < b)`, `0 (a == b)`, or `1 (a > b)` depending on the comparison result
       */
      cmp(b: BnDefinition | number): -1 | 0 | 1;
      /**
       * @description compare numbers and return `-1 (a < b)`, `0 (a == b)`, or `1 (a > b)` depending on the comparison result
       */
      ucmp(b: BnDefinition): -1 | 0 | 1;
      /**
       * @description compare numbers and return `-1 (a < b)`, `0 (a == b)`, or `1 (a > b)` depending on the comparison result
       */
      cmpn(b: number): -1 | 0 | 1;
      /**
       * @description a less than b
       */
      lt(b: BnDefinition | number): boolean;
      /**
       * @description a less than b
       */
      ltn(b: number): boolean;
      /**
       * @description a less than or equals b
       */
      lte(b: BnDefinition): boolean;
      /**
       * @description a less than or equals b
       */
      lten(b: number): boolean;
      /**
       * @description a greater than b
       */
      gt(b: BnDefinition | number): boolean;
      /**
       * @description a greater than b
       */
      gtn(b: number): boolean;
      /**
       * @description a greater than or equals b
       */
      gte(b: BnDefinition): boolean;
      /**
       * @description a greater than or equals b
       */
      gten(b: number): boolean;
      /**
       * @description a equals b
       */
      eq(b: BnDefinition | number): boolean;
      /**
       * @description a equals b
       */
      eqn(b: number): boolean;
      /**
       * @description convert to two's complement representation, where width is bit width
       */
      toTwos(width: number): BnDefinition;
      /**
       * @description  convert from two's complement representation, where width is the bit width
       */
      fromTwos(width: number): BnDefinition;
      /**
       * @description negate sign
       */
      neg(): BnDefinition;
      /**
       * @description negate sign
       */
      ineg(): BnDefinition;
      /**
       * @description absolute value
       */
      abs(): BnDefinition;
      /**
       * @description absolute value
       */
      iabs(): BnDefinition;
      /**
       * @description addition
       */
      add(b: BnDefinition | number): BnDefinition;
      /**
       * @description  addition
       */
      iadd(b: BnDefinition): BnDefinition;
      /**
       * @description addition
       */
      addn(b: number): BnDefinition;
      /**
       * @description addition
       */
      iaddn(b: number): BnDefinition;
      /**
       * @description subtraction
       */
      sub(b: BnDefinition | number): BnDefinition;
      /**
       * @description subtraction
       */
      isub(b: BnDefinition): BnDefinition;
      /**
       * @description subtraction
       */
      subn(b: number): BnDefinition;
      /**
       * @description subtraction
       */
      isubn(b: number): BnDefinition;
      /**
       * @description multiply
       */
      mul(b: BnDefinition): BnDefinition;
      /**
       * @description multiply
       */
      imul(b: BnDefinition): BnDefinition;
      /**
       * @description multiply
       */
      muln(b: number): BnDefinition;
      /**
       * @description multiply
       */
      imuln(b: number): BnDefinition;
      /**
       * @description square
       */
      sqr(): BnDefinition;
      /**
       * @description square
       */
      isqr(): BnDefinition;
      /**
       * @description raise `a` to the power of `b`
       */
      pow(b: BnDefinition): BnDefinition;
      /**
       * @description divide
       */
      div(b: BnDefinition): BnDefinition;
      /**
       * @description divide
       */
      divn(b: number): BnDefinition;
      /**
       * @description divide
       */
      idivn(b: number): BnDefinition;
      /**
       * @description reduct
       */
      mod(b: BnDefinition): BnDefinition;
      /**
       * @description reduct
       */
      umod(b: BnDefinition): BnDefinition;
      /**
       * @deprecated
       * @description reduct
       */
      modn(b: number): number;
      /**
       * @description reduct
       */
      modrn(b: number): number;
      /**
       * @description  rounded division
       */
      divRound(b: BnDefinition): BnDefinition;
      /**
       * @description or
       */
      or(b: BnDefinition): BnDefinition;
      /**
       * @description or
       */
      ior(b: BnDefinition): BnDefinition;
      /**
       * @description or
       */
      uor(b: BnDefinition): BnDefinition;
      /**
       * @description or
       */
      iuor(b: BnDefinition): BnDefinition;
      /**
       * @description and
       */
      and(b: BnDefinition): BnDefinition;
      /**
       * @description and
       */
      iand(b: BnDefinition): BnDefinition;
      /**
       * @description and
       */
      uand(b: BnDefinition): BnDefinition;
      /**
       * @description and
       */
      iuand(b: BnDefinition): BnDefinition;
      /**
       * @description and (NOTE: `andln` is going to be replaced with `andn` in future)
       */
      andln(b: number): BnDefinition;
      /**
       * @description xor
       */
      xor(b: BnDefinition): BnDefinition;
      /**
       * @description xor
       */
      ixor(b: BnDefinition): BnDefinition;
      /**
       * @description xor
       */
      uxor(b: BnDefinition): BnDefinition;
      /**
       * @description xor
       */
      iuxor(b: BnDefinition): BnDefinition;
      /**
       * @description set specified bit to 1
       */
      setn(b: number): BnDefinition;
      /**
       * @description shift left
       */
      shln(b: number): BnDefinition;
      /**
       * @description shift left
       */
      ishln(b: number): BnDefinition;
      /**
       * @description shift left
       */
      ushln(b: number): BnDefinition;
      /**
       * @description shift left
       */
      iushln(b: number): BnDefinition;
      /**
       * @description shift right
       */
      shrn(b: number): BnDefinition;
      /**
       * @description shift right (unimplemented https://github.com/indutny/bn.js/blob/master/lib/bn.js#L2086)
       */
      ishrn(b: number): BnDefinition;
      /**
       * @description shift right
       */
      ushrn(b: number): BnDefinition;
      /**
       * @description shift right
       */
      iushrn(b: number): BnDefinition;
      /**
       * @description  test if specified bit is set
       */
      testn(b: number): boolean;
      /**
       * @description clear bits with indexes higher or equal to `b`
       */
      maskn(b: number): BnDefinition;
      /**
       * @description clear bits with indexes higher or equal to `b`
       */
      imaskn(b: number): BnDefinition;
      /**
       * @description add `1 << b` to the number
       */
      bincn(b: number): BnDefinition;
      /**
       * @description not (for the width specified by `w`)
       */
      notn(w: number): BnDefinition;
      /**
       * @description not (for the width specified by `w`)
       */
      inotn(w: number): BnDefinition;
      /**
       * @description GCD
       */
      gcd(b: BnDefinition): BnDefinition;
      /**
       * @description Extended GCD results `({ a: ..., b: ..., gcd: ... })`
       */
      egcd(b: BnDefinition): {
          a: BnDefinition;
          b: BnDefinition;
          gcd: BnDefinition;
      };
      /**
       * @description inverse `a` modulo `b`
       */
      invm(b: BnDefinition): BnDefinition;
      neq(b: BnDefinition | number): boolean;
      geq(b: BnDefinition | number): boolean;
      leq(b: BnDefinition | number): boolean;
      copy(b: BnDefinition): void;
      static _prime(name: IPrimeName): MPrime;
      toRed(reductionContext: ReductionContext): any;
  }
  export const Bn: typeof BnDefinition;
  export type Bn = BnDefinition;
  export {};
  //# sourceMappingURL=bn.d.ts.map
}
declare module 'bsv/bn.d.ts' {
 
}
declare module 'bsv/br' {
  /// <reference types="node" />
  /**
   * Buffer Reader
   * =============
   *
   * This is a convenience class for reading VarInts and other basic types from a
   * buffer. This class is most useful for reading VarInts, and also for signed
   * or unsigned integers of various types. It can also read a buffer in reverse
   * order, which is useful in bitcoin which uses little endian numbers a lot so
   * you find that you must reverse things. You probably want to use it like:
   * varInt = new Br(buf).readnew VarInt()
   */
  import { Bn } from 'bsv/bn';
  export class Br {
      buf: Buffer;
      pos: number;
      constructor(buf?: Buffer);
      fromObject(obj: any): Br;
      eof(): boolean;
      read(len?: number): Buffer;
      readReverse(len?: number): Buffer;
      readUInt8(): number;
      readInt8(): number;
      readUInt16BE(): number;
      readInt16BE(): number;
      readUInt16LE(): number;
      readInt16LE(): number;
      readUInt32BE(): number;
      readInt32BE(): number;
      readUInt32LE(): number;
      readInt32LE(): number;
      readUInt64BEBn(): Bn;
      readUInt64LEBn(): Bn;
      readVarIntNum(): number;
      readVarIntBuf(): Buffer;
      readVarIntBn(): Bn;
  }
  //# sourceMappingURL=br.d.ts.map
}
declare module 'bsv/br.d.ts' {
 
}
declare module 'bsv/bsm' {
  /// <reference types="node" />
  /**
   * Bitcoin Signed Message
   * ======================
   *
   * "Bitcoin Signed Message" just refers to a standard way of signing and
   * verifying an arbitrary message. The standard way to do this involves using a
   * "Bitcoin Signed Message:\n" prefix, which this code does. You are probably
   * interested in the static Bsm.sign( ... ) and Bsm.verify( ... ) functions,
   * which deal with a base64 string representing the compressed format of a
   * signature.
   */
  import { Address } from 'bsv/address';
  import { KeyPair } from 'bsv/key-pair';
  import { Sig } from 'bsv/sig';
  import { Struct } from 'bsv/struct';
  export class Bsm extends Struct {
      static readonly magicBytes: Buffer;
      messageBuf: Buffer;
      keyPair: KeyPair;
      sig: Sig;
      address: Address;
      verified: boolean;
      constructor(messageBuf?: Buffer, keyPair?: KeyPair, sig?: Sig, address?: Address, verified?: boolean);
      static magicHash(messageBuf: Buffer): Buffer;
      static asyncMagicHash(messageBuf: Buffer): Promise<Buffer>;
      static sign(messageBuf: Buffer, keyPair: KeyPair): string;
      static asyncSign(messageBuf: Buffer, keyPair: KeyPair): Promise<string>;
      static verify(messageBuf: Buffer, sigstr: string, address: Address): boolean;
      static asyncVerify(messageBuf: Buffer, sigstr: string, address: Address): Promise<boolean>;
      sign(): this;
      verify(): this;
  }
  //# sourceMappingURL=bsm.d.ts.map
}
declare module 'bsv/bsm.d.ts' {
 
}
declare module 'bsv/bw' {
  /// <reference types="node" />
  import { Bn } from 'bsv/bn';
  /**
   * Buffer Writer
   * =============
   *
   * This is the writing complement of the Br. You can easily write
   * VarInts and other basic number types. The way to use it is: buf =
   * new Bw().write(buf1).write(buf2).toBuffer()
   */
  export class Bw {
      bufs: Buffer[];
      constructor(bufs?: Buffer[]);
      fromObject(obj: {
          bufs: Buffer[];
      }): Bw;
      getLength(): number;
      toBuffer(): Buffer;
      write(buf: Buffer): Bw;
      writeReverse(buf: Buffer): Bw;
      writeUInt8(n: number): Bw;
      writeInt8(n: number): Bw;
      writeUInt16BE(n: number): Bw;
      writeInt16BE(n: number): Bw;
      writeUInt16LE(n: number): Bw;
      writeInt16LE(n: number): Bw;
      writeUInt32BE(n: number): Bw;
      writeInt32BE(n: number): Bw;
      writeUInt32LE(n: number): Bw;
      writeInt32LE(n: number): Bw;
      writeUInt64BEBn(bn: Bn): Bw;
      writeUInt64LEBn(bn: Bn): Bw;
      writeVarIntNum(n: number): Bw;
      writeVarIntBn(bn: Bn): Bw;
      static varIntBufNum(n: number): Buffer;
      static varIntBufBn(bn: Bn): Buffer;
  }
  //# sourceMappingURL=bw.d.ts.map
}
declare module 'bsv/bw.d.ts' {
 
}
declare module 'bsv/cbc' {
  /// <reference types="node" />
  export class Cbc {
      static buf2BlocksBuf(buf: Buffer, blockSize: number): Buffer[];
      static blockBufs2Buf(blockBufs: Buffer[]): Buffer;
      static encrypt(messageBuf: Buffer, ivBuf: Buffer, blockCipher: any, cipherKeyBuf: Buffer): Buffer;
      static decrypt(encBuf: Buffer, ivBuf: Buffer, blockCipher: any, cipherKeyBuf: Buffer): Buffer;
      static encryptBlock(blockBuf: Buffer, ivBuf: Buffer, blockCipher: any, cipherKeyBuf: Buffer): Buffer;
      static decryptBlock(encBuf: Buffer, ivBuf: Buffer, blockCipher: any, cipherKeyBuf: Buffer): Buffer;
      static encryptBlocks(blockBufs: Buffer[], ivBuf: Buffer, blockCipher: any, cipherKeyBuf: Buffer): Buffer[];
      static decryptBlocks(encBufs: Buffer[], ivBuf: Buffer, blockCipher: any, cipherKeyBuf: Buffer): Buffer[];
      static pkcs7Pad(buf: Buffer, blockSize: number): Buffer;
      static pkcs7Unpad(paddedbuf: Buffer): Buffer;
      static xorBufs(buf1: Buffer, buf2: Buffer): Buffer;
  }
  //# sourceMappingURL=cbc.d.ts.map
}
declare module 'bsv/cbc.d.ts' {
 
}
declare module 'bsv/cmp' {
  /// <reference types="node" />
  /**
   * Constant-Time Buffer Compare
   * ============================
   *
   * A constant-time comparison function. This should be used in any security
   * sensitive code where leaking timing information may lead to lessened
   * security. Note that if the buffers are not equal in length, this function
   * loops for the longest buffer, which may not be necessary. Usually this
   * function should be used for buffers that would otherwise be equal length,
   * such as a hash, particularly Hmacs.
   *
   * The algorithm here, which is XORs each byte (or, if undefined, 0) with the
   * corresponding other byte, and then ORs that with a running total (d), is
   * adapted from here:
   *
   * https://groups.google.com/forum/#!topic/keyczar-discuss/VXHsoJSLKhM
   */
  export function cmp(buf1: Buffer, buf2: Buffer): boolean;
  //# sourceMappingURL=cmp.d.ts.map
}
declare module 'bsv/cmp.d.ts' {
 
}
declare module 'bsv/config' {
  class Config {
      private values;
      constructor(values: Record<string, string>);
      private keyDefined;
      private getValue;
      get(key: string): string;
  }
  export const config: Config;
  export {};
  //# sourceMappingURL=config.d.ts.map
}
declare module 'bsv/config.d.ts' {
 
}
declare module 'bsv/constants' {
  export interface NetworkConstants {
      MaxSize: number;
      Port: number;
      Address: {
          pubKeyHash: number;
          payToScriptHash: number;
      };
      Bip32: {
          pubKey: number;
          privKey: number;
      };
      Block: {
          maxNBits: number;
          magicNum: number;
      };
      Msg: {
          magicNum: number;
          versionBytesNum: number;
      };
      PrivKey: {
          versionByteNum: number;
      };
      TxBuilder: {
          dust: number;
          feePerKbNum: number;
      };
      Workers: {
          timeout: number;
      };
  }
  const Constants: {
      Mainnet: NetworkConstants;
      Testnet: NetworkConstants;
      Regtest: NetworkConstants;
      STN: NetworkConstants;
      Default: NetworkConstants;
  };
  const getConstants: (magicNum: any) => NetworkConstants;
  export { Constants, getConstants };
  //# sourceMappingURL=constants.d.ts.map
}
declare module 'bsv/constants.d.ts' {
 
}
declare module 'bsv/ecdsa' {
  /// <reference types="node" />
  /**
   * Ecdsa
   * =====
   *
   * Ecdsa is the signature algorithm used by bitcoin. The way you probably want
   * to use this is with the static Ecdsa.sign( ... ) and Ecdsa.verify( ... )
   * functions. Note that in bitcoin, the hashBuf is little endian, so if you are
   * signing or verifying something that has to do with a transaction, you should
   * explicitly plug in that it is little endian as an option to the sign and
   * verify functions.
   *
   * This implementation of Ecdsa uses deterministic signatures as defined in RFC
   * 6979 as the default, which has become a defacto standard in bitcoin wallets
   * due to recurring security issues around using a value of k pulled from a
   * possibly faulty entropy pool. If you use the same value of k twice, someone
   * can derive your private key. Deterministic k prevents this without needing
   * an entropy pool.
   */
  import { Bn } from 'bsv/bn';
  import { KeyPair } from 'bsv/key-pair';
  import { PubKey } from 'bsv/pub-key';
  import { Sig } from 'bsv/sig';
  import { Struct } from 'bsv/struct';
  interface EcdsaLike {
      sig: string;
      keyPair: string;
      hashBuf: string;
      k: string;
      endian: 'big' | 'little';
      verified: boolean;
  }
  export class Ecdsa extends Struct {
      sig: Sig;
      keyPair: KeyPair;
      hashBuf: Buffer;
      k: Bn;
      endian: 'big' | 'little';
      verified: boolean;
      constructor(sig?: Sig, keyPair?: KeyPair, hashBuf?: Buffer, k?: Bn, endian?: 'big' | 'little', verified?: boolean);
      toJSON(): EcdsaLike;
      fromJSON(json: EcdsaLike): this;
      toBuffer(): Buffer;
      fromBuffer(buf: Buffer): this;
      calcrecovery(): this;
      asyncCalcrecovery(): Promise<this>;
      /**
       * Calculates the recovery factor, and mutates sig so that it now contains
       * the recovery factor and the "compressed" variable. Throws an exception on
       * failure.
       */
      static calcrecovery(sig: Sig, pubKey: PubKey, hashBuf: Buffer): Sig;
      static asyncCalcrecovery(sig: Sig, pubKey: PubKey, hashBuf: Buffer): Promise<Sig>;
      fromString(str: string): this;
      randomK(): this;
      /**
       * The traditional Ecdsa algorithm uses a purely random value of k. This has
       * the negative that when signing, your entropy must be good, or the private
       * key can be recovered if two signatures use the same value of k. It turns out
       * that k does not have to be purely random. It can be deterministic, so long
       * as an attacker can't guess it. RFC 6979 specifies how to do this using a
       * combination of the private key and the hash of the thing to be signed. It is
       * best practice to use this value, which can be tested for byte-for-byte
       * accuracy, and is resistant to a broken RNG. Note that it is actually the
       * case that bitcoin private keys have been compromised through that attack.
       * Deterministic k is a best practice.
       *
       * https://tools.ietf.org/html/rfc6979#section-3.2
       */
      deterministicK(badrs?: number): this;
      /**
       * Information about public key recovery:
       * https://bitcointalk.org/index.php?topic=6430.0
       * http://stackoverflow.com/questions/19665491/how-do-i-get-an-ecdsa-public-key-from-just-a-bitcoin-signature-sec1-4-1-6-k
       * This code was originally taken from BitcoinJS
       */
      sig2PubKey(): PubKey;
      asyncSig2PubKey(): Promise<PubKey>;
      static sig2PubKey(sig: Sig, hashBuf: Buffer): PubKey;
      static asyncSig2PubKey(sig: Sig, hashBuf: Buffer): Promise<PubKey>;
      verifyStr(enforceLowS?: boolean): boolean | string;
      sign(): this;
      asyncSign(): Promise<this>;
      signRandomK(): this;
      toString(): string;
      verify(enforceLowS?: boolean): this;
      asyncVerify(enforceLowS?: boolean): Promise<this>;
      static sign(hashBuf: Buffer, keyPair: KeyPair, endian?: 'big' | 'little'): Sig;
      static asyncSign(hashBuf: Buffer, keyPair: KeyPair, endian?: 'big' | 'little'): Promise<Sig>;
      static verify(hashBuf: Buffer, sig: Sig, pubKey: PubKey, endian?: 'big' | 'little', enforceLowS?: boolean): boolean;
      static asyncVerify(hashBuf: Buffer, sig: Sig, pubKey: PubKey, endian?: 'big' | 'little', enforceLowS?: boolean): Promise<boolean>;
  }
  export {};
  //# sourceMappingURL=ecdsa.d.ts.map
}
declare module 'bsv/ecdsa.d.ts' {
 
}
declare module 'bsv/ecies' {
  /// <reference types="node" />
  import { KeyPair } from 'bsv/key-pair';
  import { PrivKey } from 'bsv/priv-key';
  import { PubKey } from 'bsv/pub-key';
  export class Ecies {
      static ivkEkM(privKey: PrivKey, pubKey: PubKey): {
          iv: Buffer;
          kE: Buffer;
          kM: Buffer;
      };
      static electrumEncrypt(messageBuf: Buffer, toPubKey: PubKey, fromKeyPair?: KeyPair, noKey?: boolean): Buffer;
      static electrumDecrypt(encBuf: Buffer, toPrivKey: PrivKey, fromPubKey?: PubKey): Buffer;
      static bitcoreEncrypt(messageBuf: Buffer, toPubKey: PubKey, fromKeyPair?: KeyPair, ivBuf?: Buffer): Buffer;
      static asyncBitcoreEncrypt(messageBuf: Buffer, toPubKey: PubKey, fromKeyPair?: KeyPair, ivBuf?: Buffer): Promise<Buffer>;
      static bitcoreDecrypt(encBuf: Buffer, toPrivKey: PrivKey): Buffer;
      static asyncBitcoreDecrypt(encBuf: Buffer, toPrivKey: PrivKey): Promise<Buffer>;
  }
  //# sourceMappingURL=ecies.d.ts.map
}
declare module 'bsv/ecies.d.ts' {
 
}
declare module 'bsv/hash-cache' {
  /// <reference types="node" />
  /**
   * Hash Cache
   * ==========
   *
   * For use in sighash.
   */
  import { Struct } from 'bsv/struct';
  export interface HashCacheLike {
      prevoutsHashBuf: string;
      sequenceHashBuf: string;
      outputsHashBuf: string;
  }
  export class HashCache extends Struct {
      prevoutsHashBuf: Buffer;
      sequenceHashBuf: Buffer;
      outputsHashBuf: Buffer;
      constructor(prevoutsHashBuf?: Buffer, sequenceHashBuf?: Buffer, outputsHashBuf?: Buffer);
      fromBuffer(buf: Buffer): this;
      toBuffer(): Buffer;
      fromJSON(json: HashCacheLike): this;
      toJSON(): HashCacheLike;
  }
  //# sourceMappingURL=hash-cache.d.ts.map
}
declare module 'bsv/hash-cache.d.ts' {
 
}
declare module 'bsv/hash' {
  /// <reference types="node" />
  export class Hash {
      static readonly blockSize: {
          sha1: number;
          sha256: number;
          sha512: number;
      };
      static sha1(buf: Buffer): Buffer;
      static asyncSha1(buf: Buffer): Promise<Buffer>;
      static sha256(buf: Buffer): Buffer;
      static asyncSha256(buf: Buffer): Promise<Buffer>;
      static sha256Sha256(buf: Buffer): Buffer;
      static asyncSha256Sha256(buf: Buffer): Promise<Buffer>;
      static ripemd160(buf: Buffer): Buffer;
      static asyncRipemd160(buf: Buffer): Promise<Buffer>;
      static sha256Ripemd160(buf: Buffer): Buffer;
      static asyncSha256Ripemd160(buf: Buffer): Promise<Buffer>;
      static sha512(buf: Buffer): Buffer;
      static asyncSha512(buf: Buffer): Promise<Buffer>;
      static hmac(hashFStr: 'sha1' | 'sha256' | 'sha512', data: Buffer, key: Buffer): Buffer;
      static readonly bitsize: {
          sha1Hmac: number;
          sha256Hmac: number;
          sha512Hmac: number;
      };
      static sha1Hmac(data: Buffer, key: Buffer): Buffer;
      static asyncSha1Hmac(data: Buffer, key: Buffer): Promise<Buffer>;
      static sha256Hmac(data: Buffer, key: Buffer): Buffer;
      static asyncSha256Hmac(data: Buffer, key: Buffer): Promise<Buffer>;
      static sha512Hmac(data: Buffer, key: Buffer): Buffer;
      static asyncSha512Hmac(data: Buffer, key: Buffer): Promise<Buffer>;
  }
  //# sourceMappingURL=hash.d.ts.map
}
declare module 'bsv/hash.d.ts' {
 
}
declare module 'bsv/index' {
  /// <reference types="node" />
  export * from 'bsv/address';
  export * from 'bsv/bip-32';
  export * from 'bsv/bip-39';
  export * from 'bsv/bn';
  export * from 'bsv/br';
  export * from 'bsv/bsm';
  export * from 'bsv/bw';
  export * from 'bsv/base-58';
  export * from 'bsv/base-58-check';
  export * from 'bsv/block';
  export * from 'bsv/block-header';
  export * from 'bsv/constants';
  export * from 'bsv/ecdsa';
  export * from 'bsv/hash';
  export * from 'bsv/interp';
  export * from 'bsv/key-pair';
  export * from 'bsv/op-code';
  export * from 'bsv/point';
  export * from 'bsv/priv-key';
  export * from 'bsv/pub-key';
  export * from 'bsv/random';
  export * from 'bsv/script';
  export * from 'bsv/sig';
  export * from 'bsv/sig-operations';
  export * from 'bsv/struct';
  export * from 'bsv/tx';
  export * from 'bsv/tx-builder';
  export * from 'bsv/tx-in';
  export * from 'bsv/tx-out';
  export * from 'bsv/tx-out-map';
  export * from 'bsv/tx-verifier';
  export * from 'bsv/var-int';
  export * from 'bsv/workers';
  export * from 'bsv/workers-result';
  export * from 'bsv/cmp';
  export * from 'bsv/ach';
  export * from 'bsv/aes';
  export * from 'bsv/aescbc';
  export * from 'bsv/cbc';
  export * from 'bsv/ecies';
  export const deps: {
      Buffer: typeof Buffer;
  };
  //# sourceMappingURL=index.d.ts.map
}
declare module 'bsv/index.d.ts' {
 
}
declare module 'bsv/interp' {
  /// <reference types="node" />
  /**
   * Script Interpreter
   * ==================
   *
   * Bitcoin transactions contain scripts. Each input has a script called the
   * scriptSig, and each output has a script called the scriptPubKey. To validate
   * an input, the ScriptSig is executed, then with the same stack, the
   * scriptPubKey from the output corresponding to that input is run. The primary
   * way to use this class is via the verify function:
   *
   * new Interp().verify( ... )
   *
   * In some ways, the script interpreter is one of the most poorly architected
   * components of Yours Bitcoin because of the giant switch statement in step(). But
   * that is deliberately so to make it similar to bitcoin core, and thus easier
   * to audit.
   */
  import { Bn } from 'bsv/bn';
  import { Br } from 'bsv/br';
  import { Bw } from 'bsv/bw';
  import { Script } from 'bsv/script';
  import { Struct } from 'bsv/struct';
  import { Tx, TxLike } from 'bsv/tx';
  interface InterpLike {
      script: string;
      tx?: TxLike;
      nIn: number;
      stack: string[];
      altStack: string[];
      pc: number;
      pBeginCodeHash: number;
      nOpCount: number;
      ifStack: boolean[];
      errStr: string;
      flags: number;
  }
  export class Interp extends Struct {
      static readonly true: Buffer;
      static readonly false: Buffer;
      static readonly MAX_SCRIPT_ELEMENT_SIZE = 520;
      static readonly LOCKTIME_THRESHOLD = 500000000;
      static readonly SCRIPT_VERIFY_NONE = 0;
      static readonly SCRIPT_VERIFY_P2SH: number;
      static readonly SCRIPT_VERIFY_STRICTENC: number;
      static readonly SCRIPT_VERIFY_DERSIG: number;
      static readonly SCRIPT_VERIFY_LOW_S: number;
      static readonly SCRIPT_VERIFY_NULLDUMMY: number;
      static readonly SCRIPT_VERIFY_SIGPUSHONLY: number;
      static readonly SCRIPT_VERIFY_MINIMALDATA: number;
      static readonly SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS: number;
      static readonly SCRIPT_VERIFY_CLEANSTACK: number;
      static readonly SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY: number;
      static readonly SCRIPT_VERIFY_CHECKSEQUENCEVERIFY: number;
      static readonly SCRIPT_ENABLE_SIGHASH_FORKID: number;
      static readonly defaultFlags: number;
      script: Script;
      tx: Tx;
      nIn: number;
      stack: Buffer[];
      altStack: Buffer[];
      pc: number;
      pBeginCodeHash: number;
      nOpCount: number;
      ifStack: boolean[];
      errStr: string;
      flags: number;
      valueBn: Bn;
      constructor(script?: Script, tx?: Tx, nIn?: number, stack?: Buffer[], altStack?: Buffer[], pc?: number, pBeginCodeHash?: number, nOpCount?: number, ifStack?: boolean[], errStr?: string, flags?: number, valueBn?: Bn);
      initialize(): this;
      fromJSON(json: InterpLike): this;
      /**
       * Convert JSON containing everything but the tx to an interp object.
       */
      fromJSONNoTx(json: InterpLike): this;
      fromBr(br: Br): this;
      toJSON(): InterpLike;
      /**
       * Convert everything but the tx to JSON.
       */
      toJSONNoTx(): InterpLike;
      toBw(bw?: Bw): Bw;
      /**
       * In order to make auduting the script interpreter easier, we use the same
       * constants as bitcoin core, including the flags, which customize the
       * operation of the interpreter.
       */
      static getFlags(flagstr: string): number;
      static castToBool(buf: Buffer): boolean;
      /**
       * Translated from bitcoin core's CheckSigEncoding
       */
      checkSigEncoding(buf: Buffer): boolean;
      /**
       * Translated from bitcoin core's CheckPubKeyEncoding
       */
      checkPubKeyEncoding(buf: Buffer): boolean;
      /**
       * Translated from bitcoin core's CheckLockTime
       */
      checkLockTime(nLockTime: number): boolean;
      /**
       * Translated from bitcoin core's CheckSequence.
       */
      checkSequence(nSequence: number): boolean;
      /**
       * Based on bitcoin core's EvalScript function, with the inner loop moved to
       * Interp.prototype.step()
       * bitcoin core commit: b5d1b1092998bc95313856d535c632ea5a8f9104
       */
      eval(): Generator<boolean, void, unknown>;
      /**
       * Based on the inner loop of bitcoin core's EvalScript function
       */
      step(): boolean;
      /**
       * This function has the same interface as bitcoin core's VerifyScript and is
       * the function you want to use to know if a particular input in a
       * transaction is valid or not. It simply iterates over the results generated
       * by the results method.
       */
      verify(scriptSig?: Script, scriptPubKey?: Script, tx?: Tx, nIn?: number, flags?: number, valueBn?: Bn): boolean;
      /**
       * Gives you the results of the execution each operation of the scripSig and
       * scriptPubKey corresponding to a particular input (nIn) for the concerned
       * transaction (tx). Each result can be either true or false. If true, then
       * the operation did not invalidate the transaction. If false, then the
       * operation has invalidated the script, and the transaction is not valid.
       * flags is a number that can pass in some special flags, such as whether or
       * not to execute the redeemScript in a p2sh transaction.
       *
       * This method is translated from bitcoin core's VerifyScript.  This function
       * is a generator, thus you can and need to iterate through it.  To
       * automatically return true or false, use the verify method.
       */
      results(scriptSig?: Script, scriptPubKey?: Script, tx?: Tx, nIn?: number, flags?: number, valueBn?: Bn): Generator<boolean, void, unknown>;
      /**
       * If the script has failed, this methods returns valuable debug
       * information about exactly where the script failed. It is a
       * JSON-compatible object so it can be easily stringified. pc refers to the
       * currently executing opcode.
       */
      getDebugObject(): {
          errStr: string;
          scriptStr: string;
          pc: number;
          stack: string[];
          altStack: string[];
          opCodeStr: string;
      };
      getDebugString(): string;
  }
  export {};
  //# sourceMappingURL=interp.d.ts.map
}
declare module 'bsv/interp.d.ts' {
 
}
declare module 'bsv/inv' {
  /// <reference types="node" />
  /**
   * Inv
   * ===
   *
   * Inventory - used in p2p messages.
   */
  import { Br } from 'bsv/br';
  import { Bw } from 'bsv/bw';
  import { Struct } from 'bsv/struct';
  export class Inv extends Struct {
      static readonly MSG_TX = 1;
      static readonly MSG_BLOCK = 2;
      static readonly MSG_FILTERED_BLOCK = 3;
      typeNum: number;
      hashBuf: Buffer;
      constructor(typeNum?: number, hashBuf?: Buffer);
      fromBr(br: Br): this;
      toBw(bw?: Bw): Bw;
      isTx(): boolean;
      isBlock(): boolean;
      isFilteredBlock(): boolean;
  }
  //# sourceMappingURL=inv.d.ts.map
}
declare module 'bsv/inv.d.ts' {
 
}
declare module 'bsv/key-pair' {
  /**
   * KeyPair
   * =======
   *
   * A keyPair is a collection of a private key and a public key.
   * const keyPair = new KeyPair().fromRandom()
   * const keyPair = new KeyPair().fromPrivKey(privKey)
   * const privKey = keyPair.privKey
   * const pubKey = keyPair.pubKey
   */
  import { Br } from 'bsv/br';
  import { Bw } from 'bsv/bw';
  import { PrivKey as DefaultPrivKey } from 'bsv/priv-key';
  import { PubKey } from 'bsv/pub-key';
  import { Struct } from 'bsv/struct';
  interface KeyPairLike {
      privKey: string;
      pubKey: string;
  }
  export class KeyPair extends Struct {
      privKey: DefaultPrivKey;
      pubKey: PubKey;
      PrivKey: typeof DefaultPrivKey;
      constructor(privKey?: DefaultPrivKey, pubKey?: PubKey, PrivKey?: typeof DefaultPrivKey);
      fromJSON(json: KeyPairLike): this;
      fromBr(br: Br): this;
      toBw(bw?: Bw): Bw;
      fromString(str: string): this;
      toString(): string;
      toPublic(): KeyPair;
      fromPrivKey(privKey: DefaultPrivKey): this;
      static fromPrivKey(privKey: DefaultPrivKey): KeyPair;
      asyncFromPrivKey(privKey: DefaultPrivKey): Promise<this>;
      static asyncFromPrivKey(privKey: DefaultPrivKey): Promise<KeyPair>;
      fromRandom(): this;
      static fromRandom(): KeyPair;
      asyncFromRandom(): Promise<this>;
      static asyncFromRandom(): Promise<KeyPair>;
      static Mainnet: typeof KeyPair;
      static Testnet: typeof KeyPair;
  }
  export {};
  //# sourceMappingURL=key-pair.d.ts.map
}
declare module 'bsv/key-pair.d.ts' {
 
}
declare module 'bsv/merkle' {
  /// <reference types="node" />
  import { Struct } from 'bsv/struct';
  export class Merkle extends Struct {
      hashBuf: Buffer;
      buf: Buffer;
      merkle1: Merkle;
      merkle2: Merkle;
      constructor(hashBuf?: Buffer, buf?: Buffer, merkle1?: Merkle, merkle2?: Merkle);
      hash(): Buffer;
      fromBuffers(bufs: Buffer[]): this;
      static fromBuffers(bufs: Buffer[]): Merkle;
      /**
       * Takes two arrays, both of which *must* be of a length that is a power of
       * two.
       */
      fromBufferArrays(bufs1: Buffer[], bufs2: Buffer[]): this;
      static fromBufferArrays(bufs1: Buffer[], bufs2: Buffer[]): Merkle;
      leavesNum(): number;
  }
  //# sourceMappingURL=merkle.d.ts.map
}
declare module 'bsv/merkle.d.ts' {
 
}
declare module 'bsv/msg' {
  /// <reference types="node" />
  /**
   * Peer-to-Peer Network Message
   * ============================
   *
   * A message on the bitcoin p2p network.
   */
  import { Br } from 'bsv/br';
  import { Bw } from 'bsv/bw';
  import { NetworkConstants } from 'bsv/constants';
  import { Struct } from 'bsv/struct';
  export class Msg extends Struct {
      constants: NetworkConstants;
      magicNum: number;
      cmdbuf: Buffer;
      datasize: number;
      checksumbuf: Buffer;
      dataBuf: Buffer;
      constructor(magicNum?: number, cmdbuf?: Buffer, datasize?: number, checksumbuf?: Buffer, dataBuf?: Buffer, constants?: NetworkConstants);
      setCmd(cmdname: string): this;
      getCmd(): string;
      static checksum(dataBuf: Buffer): Buffer;
      static asyncChecksum(dataBuf: Buffer): Promise<Buffer>;
      setData(dataBuf: Buffer): this;
      asyncSetData(dataBuf: Buffer): Promise<this>;
      /**
       * An iterator to produce a message from a series of buffers. Set opts.strict
       * to throw an error if an invalid message occurs in stream.
       */
      genFromBuffers(opts?: {
          strict?: boolean;
      }): Generator<number, any, Buffer>;
      fromBr(br: Br): this;
      toBw(bw?: Bw): Bw;
      fromJSON(json: {
          magicNum: number;
          cmdbuf: string;
          datasize: number;
          checksumbuf: string;
          dataBuf: string;
      }): this;
      toJSON(): {
          magicNum: number;
          cmdbuf: string;
          datasize: number;
          checksumbuf: string;
          dataBuf: string;
      };
      isValid(): boolean;
      asyncIsValid(): Promise<boolean>;
      validate(): this;
      asyncValidate(): Promise<void>;
      static Mainnet: typeof Msg;
      static Testnet: typeof Msg;
      static Regtest: typeof Msg;
      static STN: typeof Msg;
  }
  //# sourceMappingURL=msg.d.ts.map
}
declare module 'bsv/msg.d.ts' {
 
}
declare module 'bsv/op-code' {
  import { Struct } from 'bsv/struct';
  enum OpCodeValue {
      OP_FALSE = 0,
      OP_0 = 0,
      OP_PUSHDATA1 = 76,
      OP_PUSHDATA2 = 77,
      OP_PUSHDATA4 = 78,
      OP_1NEGATE = 79,
      OP_RESERVED = 80,
      OP_TRUE = 81,
      OP_1 = 81,
      OP_2 = 82,
      OP_3 = 83,
      OP_4 = 84,
      OP_5 = 85,
      OP_6 = 86,
      OP_7 = 87,
      OP_8 = 88,
      OP_9 = 89,
      OP_10 = 90,
      OP_11 = 91,
      OP_12 = 92,
      OP_13 = 93,
      OP_14 = 94,
      OP_15 = 95,
      OP_16 = 96,
      OP_NOP = 97,
      OP_VER = 98,
      OP_IF = 99,
      OP_NOTIF = 100,
      OP_VERIF = 101,
      OP_VERNOTIF = 102,
      OP_ELSE = 103,
      OP_ENDIF = 104,
      OP_VERIFY = 105,
      OP_RETURN = 106,
      OP_TOALTSTACK = 107,
      OP_FROMALTSTACK = 108,
      OP_2DROP = 109,
      OP_2DUP = 110,
      OP_3DUP = 111,
      OP_2OVER = 112,
      OP_2ROT = 113,
      OP_2SWAP = 114,
      OP_IFDUP = 115,
      OP_DEPTH = 116,
      OP_DROP = 117,
      OP_DUP = 118,
      OP_NIP = 119,
      OP_OVER = 120,
      OP_PICK = 121,
      OP_ROLL = 122,
      OP_ROT = 123,
      OP_SWAP = 124,
      OP_TUCK = 125,
      OP_CAT = 126,
      OP_SUBSTR = 127,
      OP_SPLIT = 127,
      OP_LEFT = 128,
      OP_NUM2BIN = 128,
      OP_RIGHT = 129,
      OP_BIN2NUM = 129,
      OP_SIZE = 130,
      OP_INVERT = 131,
      OP_AND = 132,
      OP_OR = 133,
      OP_XOR = 134,
      OP_EQUAL = 135,
      OP_EQUALVERIFY = 136,
      OP_RESERVED1 = 137,
      OP_RESERVED2 = 138,
      OP_1ADD = 139,
      OP_1SUB = 140,
      OP_2MUL = 141,
      OP_2DIV = 142,
      OP_NEGATE = 143,
      OP_ABS = 144,
      OP_NOT = 145,
      OP_0NOTEQUAL = 146,
      OP_ADD = 147,
      OP_SUB = 148,
      OP_MUL = 149,
      OP_DIV = 150,
      OP_MOD = 151,
      OP_LSHIFT = 152,
      OP_RSHIFT = 153,
      OP_BOOLAND = 154,
      OP_BOOLOR = 155,
      OP_NUMEQUAL = 156,
      OP_NUMEQUALVERIFY = 157,
      OP_NUMNOTEQUAL = 158,
      OP_LESSTHAN = 159,
      OP_GREATERTHAN = 160,
      OP_LESSTHANOREQUAL = 161,
      OP_GREATERTHANOREQUAL = 162,
      OP_MIN = 163,
      OP_MAX = 164,
      OP_WITHIN = 165,
      OP_RIPEMD160 = 166,
      OP_SHA1 = 167,
      OP_SHA256 = 168,
      OP_HASH160 = 169,
      OP_HASH256 = 170,
      OP_CODESEPARATOR = 171,
      OP_CHECKSIG = 172,
      OP_CHECKSIGVERIFY = 173,
      OP_CHECKMULTISIG = 174,
      OP_CHECKMULTISIGVERIFY = 175,
      OP_NOP1 = 176,
      OP_NOP2 = 177,
      OP_CHECKLOCKTIMEVERIFY = 177,
      OP_NOP3 = 178,
      OP_CHECKSEQUENCEVERIFY = 178,
      OP_NOP4 = 179,
      OP_NOP5 = 180,
      OP_NOP6 = 181,
      OP_NOP7 = 182,
      OP_NOP8 = 183,
      OP_NOP9 = 184,
      OP_NOP10 = 185,
      OP_SMALLDATA = 249,
      OP_SMALLINTEGER = 250,
      OP_PUBKEYS = 251,
      OP_PUBKEYHASH = 253,
      OP_PUBKEY = 254,
      OP_INVALIDOPCODE = 255
  }
  class _OpCode extends Struct {
      static str: {
          [key in OpCodeValue]: keyof typeof OpCodeValue;
      };
      num: number;
      constructor(num?: number);
      fromNumber(num: number): this;
      static fromNumber(num: number): _OpCode;
      toNumber(): number;
      fromString(str: string): this;
      toString(): string;
  }
  export const OpCode: typeof _OpCode & (new () => _OpCode) & typeof OpCodeValue;
  export type OpCode = _OpCode;
  export {};
  //# sourceMappingURL=op-code.d.ts.map
}
declare module 'bsv/op-code.d.ts' {
 
}
declare module 'bsv/point' {
  import { Bn } from 'bsv/bn';
  interface _Point {
      isInfinity(): boolean;
      eq(point: _Point): boolean;
  }
  const _Point: new (...rest: any[]) => _Point;
  export class Point extends _Point {
      x: Bn;
      y: Bn;
      constructor(x?: Bn, y?: Bn, isRed?: boolean);
      static fromX(isOdd: boolean, x: Bn | number): Point;
      copyFrom(point: Point): this;
      add(p: Point): Point;
      mul(bn: Bn): Point;
      mulAdd(bn1: Bn, point: Point, bn2: Bn): Point;
      getX(): Bn;
      getY(): Bn;
      fromX(isOdd: boolean, x: Bn): this;
      toJSON(): {
          x: string;
          y: string;
      };
      fromJSON(json: {
          x: string;
          y: string;
      }): this;
      toString(): string;
      fromString(str: string): this;
      static getG(): Point;
      static getN(): Bn;
      validate(): this;
  }
  export {};
  //# sourceMappingURL=point.d.ts.map
}
declare module 'bsv/point.d.ts' {
 
}
declare module 'bsv/priv-key' {
  /// <reference types="node" />
  import { Bn } from 'bsv/bn';
  import { NetworkConstants } from 'bsv/constants';
  import { Struct } from 'bsv/struct';
  export class PrivKey extends Struct {
      bn: Bn;
      compressed: boolean;
      Constants: NetworkConstants['PrivKey'];
      constructor(bn?: Bn, compressed?: boolean, constants?: NetworkConstants['PrivKey']);
      fromJSON(json: string): this;
      toJSON(): string;
      fromRandom(): this;
      static fromRandom(): PrivKey;
      toBuffer(): Buffer;
      fromBuffer(buf: Buffer): this;
      toBn(): Bn;
      fromBn(bn: Bn): this;
      static fromBn(bn: Bn): PrivKey;
      validate(): this;
      /**
       * Output the private key a Wallet Import Format (Wif) string.
       */
      toWif(): string;
      /**
       * Input the private key from a Wallet Import Format (Wif) string.
       */
      fromWif(str: string): this;
      static fromWif(str: string): PrivKey;
      toString(): string;
      fromString(str: string): this;
      static Mainnet: typeof PrivKey;
      static Testnet: typeof PrivKey;
  }
  //# sourceMappingURL=priv-key.d.ts.map
}
declare module 'bsv/priv-key.d.ts' {
 
}
declare module 'bsv/pub-key' {
  /// <reference types="node" />
  /**
   * Public Key
   * ==========
   *
   * A public key corresponds to a private key. If you have a private key, you
   * can find the corresponding public key with new PubKey().fromPrivKey(privKey).
   */
  import { Bn } from 'bsv/bn';
  import { Point } from 'bsv/point';
  import { PrivKey } from 'bsv/priv-key';
  import { Struct } from 'bsv/struct';
  export class PubKey extends Struct {
      point: Point;
      compressed: boolean;
      constructor(point?: Point, compressed?: boolean);
      fromJSON(json: string): this;
      toJSON(): string;
      fromPrivKey(privKey: PrivKey): this;
      static fromPrivKey(privKey: PrivKey): PubKey;
      asyncFromPrivKey(privKey: PrivKey): Promise<this>;
      static asyncFromPrivKey(privKey: PrivKey): Promise<PubKey>;
      fromBuffer(buf: Buffer, strict?: boolean): this;
      asyncFromBuffer(buf: Buffer, strict?: boolean): Promise<this>;
      fromFastBuffer(buf: Buffer): this;
      /**
       * In order to mimic the non-strict style of OpenSSL, set strict = false. For
       * information and what prefixes 0x06 and 0x07 mean, in addition to the normal
       * compressed and uncompressed public keys, see the message by Peter Wuille
       * where he discovered these "hybrid pubKeys" on the mailing list:
       * http://sourceforge.net/p/bitcoin/mailman/message/29416133/
       */
      fromDer(buf: Buffer, strict?: boolean): this;
      static fromDer(buf: Buffer, strict?: boolean): PubKey;
      fromString(str: string): this;
      fromX(odd: boolean, x: Bn): this;
      static fromX(odd: boolean, x: Bn): PubKey;
      toBuffer(): Buffer;
      toFastBuffer(): Buffer;
      toDer(compressed?: boolean): Buffer;
      toString(): string;
      /**
       * Translated from bitcoind's IsCompressedOrUncompressedPubKey
       */
      static isCompressedOrUncompressed(buf: Buffer): boolean;
      validate(): this;
  }
  //# sourceMappingURL=pub-key.d.ts.map
}
declare module 'bsv/pub-key.d.ts' {
 
}
declare module 'bsv/random' {
  /// <reference types="node" />
  export class Random {
      static getRandomBuffer(size: number): Buffer;
  }
  //# sourceMappingURL=random.d.ts.map
}
declare module 'bsv/random.d.ts' {
 
}
declare module 'bsv/script' {
  /// <reference types="node" />
  import { Bn } from 'bsv/bn';
  import { PubKey } from 'bsv/pub-key';
  import { Struct } from 'bsv/struct';
  interface ScriptChunk {
      buf?: Buffer;
      len?: number;
      opCodeNum: number;
  }
  export class Script extends Struct {
      chunks: ScriptChunk[];
      constructor(chunks?: ScriptChunk[]);
      fromJSON(json: string): this;
      toJSON(): string;
      fromBuffer(buf: Buffer): this;
      toBuffer(): Buffer;
      fromString(str: string): this;
      toString(): string;
      /**
       * Input the script from the script string format used in bitcoind data tests
       */
      fromBitcoindString(str: string): this;
      static fromBitcoindString(str: string): Script;
      /**
       * Output the script to the script string format used in bitcoind data tests.
       */
      toBitcoindString(): string;
      /**
       * Input the script from the script string format used in bitcoind data tests
       */
      fromAsmString(str: string): this;
      static fromAsmString(str: string): Script;
      /**
       * Output the script to the script string format used in bitcoind data tests.
       */
      toAsmString(): string;
      private _chunkToString;
      fromOpReturnData(dataBuf: Buffer): this;
      static fromOpReturnData(dataBuf: Buffer): Script;
      fromSafeData(dataBuf: Buffer): this;
      static fromSafeData(dataBuf: Buffer): Script;
      fromSafeDataArray(dataBufs: Buffer[]): this;
      static fromSafeDataArray(dataBufs: Buffer[]): Script;
      getData(): Buffer[];
      /**
       * Turn script into a standard pubKeyHash output script
       */
      fromPubKeyHash(hashBuf: Buffer): this;
      static fromPubKeyHash(hashBuf: Buffer): Script;
      static sortPubKeys(pubKeys: PubKey[]): PubKey[];
      /**
       * Generate a multisig output script from a list of public keys. sort
       * defaults to true. If sort is true, the pubKeys are sorted
       * lexicographically.
       */
      fromPubKeys(m: number, pubKeys: PubKey[], sort?: boolean): this;
      static fromPubKeys(m: number, pubKeys: PubKey[], sort?: boolean): Script;
      removeCodeseparators(): this;
      isPushOnly(): boolean;
      isNonSpendable(): boolean;
      isOpReturn(): boolean;
      isSafeDataOut(): boolean;
      isPubKeyHashOut(): boolean;
      /**
       * A pubKeyHash input should consist of two push operations. The first push
       * operation may be OP_0, which means the signature is missing, which is true
       * for some partially signed (and invalid) transactions.
       */
      isPubKeyHashIn(): boolean;
      isScriptHashOut(): boolean;
      /**
       * Note that these are frequently indistinguishable from pubKeyHashin
       */
      isScriptHashIn(): boolean;
      isMultiSigOut(): boolean;
      isMultiSigIn(): boolean;
      /**
       * Analagous to bitcoind's FindAndDelete Find and deconste equivalent chunks,
       * typically used with push data chunks.  Note that this will find and deconste
       * not just the same data, but the same data with the same push data op as
       * produced by default. i.e., if a pushdata in a tx does not use the minimal
       * pushdata op, then when you try to remove the data it is pushing, it will not
       * be removed, because they do not use the same pushdata op.
       */
      findAndDelete(script: Script): this;
      writeScript(script: Script): this;
      static writeScript(script: Script): Script;
      writeString(str: string): this;
      static writeString(str: string): Script;
      writeOpCode(opCodeNum: number): this;
      static writeOpCode(opCodeNum: number): Script;
      setChunkOpCode(i: number, opCodeNum: number): this;
      writeBn(bn: Bn): this;
      static writeBn(bn: Bn): Script;
      writeNumber(num: number): this;
      static writeNumber(num: number): Script;
      setChunkBn(i: number, bn: Bn): this;
      writeBuffer(buf: Buffer): this;
      static writeBuffer(buf: Buffer): Script;
      setChunkBuffer(i: number, buf: Buffer): this;
      checkMinimalPush(i: number): boolean;
  }
  export {};
  //# sourceMappingURL=script.d.ts.map
}
declare module 'bsv/script.d.ts' {
 
}
declare module 'bsv/sig-operations' {
  /// <reference types="node" />
  import { Struct } from 'bsv/struct';
  interface SigOperationsMapItem {
      nScriptChunk: number;
      type: 'sig' | 'pubKey';
      addressStr: string;
      nHashType: number;
      log?: any;
  }
  export interface SigOperationsLike {
      [label: string]: SigOperationsMapItem[];
  }
  export class SigOperations extends Struct {
      map: Map<string, SigOperationsMapItem[]>;
      constructor(map?: Map<string, SigOperationsMapItem[]>);
      toJSON(): {
          [label: string]: SigOperationsMapItem[];
      };
      fromJSON(json: {
          [label: string]: SigOperationsMapItem[];
      }): this;
      /**
       * Set an address to in the map for use with single-sig.
       *
       * @param {Buffer} txHashBuf The hash of a transsaction. Note that this is
       * *not* the reversed transaction id, but is the raw hash.
       * @param {Number} txOutNum The output number, a.k.a. the "vout".
       * @param {Number} nScriptChunk The index of the chunk of the script where
       * we are going to place the signature.
       * @param {String} addressStr The addressStr coresponding to this (txHashBuf,
       * txOutNum, nScriptChunk) where we are going to sign and insert the
       * signature or public key.
       * @param {Number} nHashType Usually = Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID
       */
      setOne(txHashBuf: Buffer, txOutNum: number, nScriptChunk: number, type: 'sig' | 'pubKey', addressStr: string, nHashType?: number): this;
      /**
       * Set a bunch of addresses for signing an input such as for use with multi-sig.
       *
       * @param {Buffer} txHashBuf The hash of a transsaction. Note that this is
       * *not* the reversed transaction id, but is the raw hash.
       * @param {Number} txOutNum The output number, a.k.a. the "vout".
       * @param {Array} arr Must take the form of [{nScriptChunk, type, addressStr, nHashType}, ...]
       */
      setMany(txHashBuf: Buffer, txOutNum: number, arr: SigOperationsMapItem[]): this;
      addOne(txHashBuf: Buffer, txOutNum: number, nScriptChunk: number, type: 'sig' | 'pubKey', addressStr: string, nHashType?: number): this;
      /**
       * Get an address from the map
       *
       * @param {Buffer} txHashBuf The hash of a transction. Note that this is *not*
       * the reversed transaction id, but is the raw hash.
       * @param {Number} txOutNum The output number, a.k.a. the "vout".
       * @param {Number} nScriptChunk The index of the chunk of the script where
       * we are going to place the signature.
       */
      get(txHashBuf: Buffer, txOutNum: number): SigOperationsMapItem[];
  }
  export {};
  //# sourceMappingURL=sig-operations.d.ts.map
}
declare module 'bsv/sig-operations.d.ts' {
 
}
declare module 'bsv/sig' {
  /// <reference types="node" />
  /**
   * Signature
   * =========
   *
   * A signature is the thing you make when you want to sign a transaction, or
   * the thing you want to verify if you want to ensure that someone signed a
   * transaction. It has an r and s value, which are the cryptographic big
   * numbers that define a signature. And since this is a bitcoin library, it
   * also has nHashType, which is the way to hash a transaction and is used in
   * the binary format of a signature when it is in a transaction. We also
   * support a public key recover value, recovery, allowing one to compute the
   * public key from a signature. The "compressed" value is also necessary to
   * accurately compute the public key from a signature.
   *
   * There are a few different formats of a signature in bitcoin. One is DER, the
   * other is the TxFormat which is the same as DER but with the nHashType byte
   * appended, and the final one is Compact, which is used by Bitcoin Signed
   * Message (Bsm).
   */
  import { Bn } from 'bsv/bn';
  import { Struct } from 'bsv/struct';
  /**
   * r, s: big numbers constiting a cryptographic signature
   * nHashType: found at the end of a signature in a transaction
   * recovery: public key recovery number
   * compressed: whether the recovered pubKey is compressed
   */
  export class Sig extends Struct {
      static readonly SIGHASH_ALL = 1;
      static readonly SIGHASH_NONE = 2;
      static readonly SIGHASH_SINGLE = 3;
      static readonly SIGHASH_FORKID = 64;
      static readonly SIGHASH_ANYONECANPAY = 128;
      r: Bn;
      s: Bn;
      nHashType: number;
      recovery: number;
      compressed: boolean;
      constructor(r?: Bn, s?: Bn, nHashType?: number, recovery?: number, compressed?: boolean);
      fromBuffer(buf: Buffer): this;
      toBuffer(): Buffer;
      fromCompact(buf: Buffer): this;
      static fromCompact(buf: Buffer): Sig;
      fromRS(rsbuf: Buffer): this;
      static fromRS(rsbuf: Buffer): Sig;
      fromDer(buf: Buffer, strict?: boolean): this;
      static fromDer(buf: Buffer, strict?: boolean): Sig;
      fromTxFormat(buf: Buffer): this;
      static fromTxFormat(buf: Buffer): Sig;
      fromString(str: string): this;
      /**
       * In order to mimic the non-strict DER encoding of OpenSSL, set strict = false.
       */
      static parseDer(buf: Buffer, strict?: boolean): {
          header: number;
          length: number;
          rheader: number;
          rlength: number;
          rneg: boolean;
          rbuf: Buffer;
          r: Bn;
          sheader: number;
          slength: number;
          sneg: boolean;
          sbuf: Buffer;
          s: Bn;
      };
      /**
       * This function is translated from bitcoind's IsDERSignature and is used in
       * the script interpreter.  This "DER" format actually includes an extra byte,
       * the nHashType, at the end. It is really the tx format, not DER format.
       *
       * A canonical signature exists of: [30] [total len] [02] [len R] [R] [02] [len S] [S] [hashtype]
       * Where R and S are not negative (their first byte has its highest bit not set), and not
       * excessively padded (do not start with a 0 byte, unless an otherwise negative number follows,
       * in which case a single 0 byte is necessary and even required).
       *
       * See https://bitcointalk.org/index.php?topic=8392.msg127623#msg127623
       */
      static IsTxDer(buf: Buffer): boolean;
      /**
       * Compares to bitcoind's IsLowDERSignature
       * See also Ecdsa signature algorithm which enforces this.
       * See also Bip 62, "low S values in signatures"
       */
      hasLowS(): boolean;
      /**
       * Ensures the nHashType is exactly equal to one of the standard options or combinations thereof.
       * Translated from bitcoind's IsDefinedHashtypeSignature
       */
      hasDefinedHashType(): boolean;
      toCompact(recovery?: number, compressed?: boolean): Buffer;
      toRS(): Buffer;
      toDer(): Buffer;
      toTxFormat(): Buffer;
      toString(): string;
  }
  //# sourceMappingURL=sig.d.ts.map
}
declare module 'bsv/sig.d.ts' {
 
}
declare module 'bsv/struct' {
  /// <reference types="node" />
  import { Br } from 'bsv/br';
  import { Bw } from 'bsv/bw';
  export class Struct {
      constructor(obj?: any);
      fromObject(obj: any): this;
      static fromObject<T extends Struct>(this: (new () => T) & typeof Struct, obj: any): T;
      fromBr(br: Br, ..._rest: any[]): this;
      static fromBr<T extends Struct>(this: (new () => T) & typeof Struct, br: Br): T;
      asyncFromBr(br: Br, ..._rest: any[]): Promise<this>;
      static asyncFromBr<T extends Struct>(this: (new () => T) & typeof Struct, br: Br): Promise<T>;
      toBw(_bw?: Bw): Bw;
      asyncToBw(_bw?: Bw): Promise<Bw>;
      /**
       * It is very often the case that you want to create a bitcoin object from a
       * stream of small buffers rather than from a buffer of the correct length.
       * For instance, if streaming from the network or disk. The genFromBuffers
       * method is a generator which produces an iterator. Use .next(buf) to pass
       * in a small buffer. The iterator will end when it has received enough data
       * to produce the object. In some cases it is able to yield the number of
       * bytes it is expecting, but that is not always known.
       */
      genFromBuffers(): Generator<any, any, any>;
      /**
       * A convenience method used by from the genFromBuffers* generators.
       * Basically lets you expect a certain number of bytes (len) and keeps
       * yielding until you give it enough. It yields the expected amount
       * remaining, and returns an object containing a buffer of the expected
       * length, and, if any, the remainder buffer.
       */
      expect(len: number, startbuf?: Buffer): Generator<number, {
          buf: Buffer;
          remainderbuf: Buffer;
      }, Buffer>;
      /**
       * Convert a buffer into an object, i.e. deserialize the object.
       */
      fromBuffer(buf: Buffer, ...rest: any[]): this;
      static fromBuffer<T extends Struct>(this: (new () => T) & typeof Struct, buf: Buffer, ...rest: any[]): T;
      asyncFromBuffer(buf: Buffer, ...rest: any[]): Promise<this>;
      static asyncFromBuffer<T extends Struct>(this: (new () => T) & typeof Struct, buf: Buffer, ...rest: any[]): Promise<T>;
      /**
       * The complement of toFastBuffer - see description for toFastBuffer
       */
      fromFastBuffer(buf: Buffer, ...rest: any[]): this;
      static fromFastBuffer<T extends Struct>(this: (new () => T) & typeof Struct, buf: Buffer, ...rest: any[]): T;
      /**
       * Convert the object into a buffer, i.e. serialize the object. This method
       * may block the main thread.
       */
      toBuffer(): Buffer;
      asyncToBuffer(): Promise<Buffer>;
      /**
       * Sometimes the toBuffer method has cryptography and blocks the main thread,
       * and we need a non-blocking way to serialize an object. That is what
       * toFastBuffer is. Of course it defaults to just using toBuffer if an object
       * hasn't implemented it. If your regular toBuffer method blocks, like with
       * Bip32, then you should implement this method to be non-blocking. This
       * method is used to send objects to the workers. i.e., for converting a
       * Bip32 object to a string, we need to encode it as a buffer in a
       * non-blocking manner with toFastBuffer, send it to a worker, then the
       * worker converts it to a string, which is a blocking operation.
       *
       * It is very common to want to convert a blank object to a zero length
       * buffer, so we can transport a blank object to a worker. So that behavior
       * is included by default.
       */
      toFastBuffer(): Buffer;
      fromHex(hex: string, ...rest: any[]): this;
      static fromHex<T extends Struct>(this: (new () => T) & typeof Struct, hex: string, ...rest: any[]): T;
      asyncFromHex(hex: string, ...rest: any[]): Promise<this>;
      static asyncFromHex<T extends Struct>(this: (new () => T) & typeof Struct, hex: string, ...rest: any[]): Promise<T>;
      fromFastHex(hex: string, ...rest: any[]): this;
      static fromFastHex<T extends Struct>(this: (new () => T) & typeof Struct, hex: string, ...rest: any[]): T;
      toHex(): string;
      asyncToHex(): Promise<string>;
      toFastHex(): string;
      fromString(str: string, ...rest: any[]): this;
      static fromString<T extends Struct>(this: (new () => T) & typeof Struct, str: string, ...rest: any[]): T;
      asyncFromString(str: string, ...rest: any[]): Promise<this>;
      static asyncFromString<T extends Struct>(this: (new () => T) & typeof Struct, str: string, ...rest: any[]): Promise<T>;
      toString(): string;
      asyncToString(): Promise<string>;
      fromJSON(_json: any): this;
      static fromJSON<T extends Struct>(this: (new () => T) & typeof Struct, json: any): T;
      asyncFromJSON(_json: any, ..._rest: any[]): Promise<this>;
      static asyncFromJSON<T extends Struct>(this: (new () => T) & typeof Struct, json: any, ...rest: any[]): Promise<T>;
      toJSON(): any;
      asyncToJSON(): Promise<any>;
      clone(): this;
      cloneByBuffer(): this;
      cloneByFastBuffer(): this;
      cloneByHex(): this;
      cloneByString(): this;
      cloneByJSON(): this;
  }
  //# sourceMappingURL=struct.d.ts.map
}
declare module 'bsv/struct.d.ts' {
 
}
declare module 'bsv/tx-builder' {
  /// <reference types="node" />
  /**
   * Transaction Builder
   * ===================
   */
  import { Address } from 'bsv/address';
  import { Bn } from 'bsv/bn';
  import { HashCache, HashCacheLike } from 'bsv/hash-cache';
  import { KeyPair } from 'bsv/key-pair';
  import { PubKey } from 'bsv/pub-key';
  import { Script } from 'bsv/script';
  import { Sig } from 'bsv/sig';
  import { SigOperations, SigOperationsLike } from 'bsv/sig-operations';
  import { Struct } from 'bsv/struct';
  import { Tx } from 'bsv/tx';
  import { TxIn } from 'bsv/tx-in';
  import { TxOut } from 'bsv/tx-out';
  import { TxOutMap, TxOutMapLike } from 'bsv/tx-out-map';
  
  export interface TxBuilderLike {
      tx: string;
      txIns: string[];
      txOuts: string[];
      uTxOutMap: TxOutMapLike;
      sigOperations: SigOperationsLike;
      changeScript: string;
      changeAmountBn: number;
      feeAmountBn: number;
      feePerKbNum: number;
      sigsPerInput: number;
      dust: number;
      dustChangeToFees: boolean;
      hashCache: HashCacheLike;
		recordActions: any[]
		currentLinkStates: {[location:string]: any}
		additionalOutputs:  Array<{ toAddrStr: string; satoshis: number }>
  }
  export class TxBuilder extends Struct {
      tx: Tx;
      txIns: TxIn[];
      txOuts: TxOut[];
      uTxOutMap: TxOutMap;
      sigOperations: SigOperations;
      changeScript: Script;
      changeAmountBn: Bn;
      feeAmountBn: Bn;
      feePerKbNum: number;
      sigsPerInput: number;
      dust: number;
      dustChangeToFees: boolean;
      hashCache: HashCache;
      nLockTime: number;
      versionBytesNum: number;
      constructor(tx?: Tx, txIns?: TxIn[], txOuts?: TxOut[], uTxOutMap?: TxOutMap, sigOperations?: SigOperations, changeScript?: Script, changeAmountBn?: Bn, feeAmountBn?: Bn, feePerKbNum?: number, nLockTime?: number, versionBytesNum?: number, sigsPerInput?: number, dust?: number, dustChangeToFees?: boolean, hashCache?: HashCache);
      toJSON(): TxBuilderLike;
      fromJSON(json: TxBuilderLike): this;
      setFeePerKbNum(feePerKbNum: number): this;
      setChangeAddress(changeAddress: Address): this;
      setChangeScript(changeScript: Script): this;
      /**
       * nLockTime is an unsigned integer.
       */
      setNLocktime(nLockTime: number): this;
      setVersion(versionBytesNum: number): this;
      /**
       * Sometimes one of your outputs or the change output will be less than
       * dust. Values less than dust cannot be broadcast. If you are OK with
       * sending dust amounts to fees, then set this value to true.
       */
      setDust(dust?: number): this;
      /**
       * Sometimes one of your outputs or the change output will be less than
       * dust. Values less than dust cannot be broadcast. If you are OK with
       * sending dust amounts to fees, then set this value to true. We
       * preferentially send all dust to the change if possible. However, that
       * might not be possible if the change itself is less than dust, in which
       * case all dust goes to fees.
       */
      sendDustChangeToFees(dustChangeToFees?: boolean): this;
      /**
       * Import a transaction partially signed by someone else. The only thing you
       * can do after this is sign one or more inputs. Usually used for multisig
       * transactions. uTxOutMap is optional. It is not necessary so long as you
       * pass in the txOut when you sign. You need to know the output when signing
       * an input, including the script in the output, which is why this is
       * necessary when signing an input.
       */
      importPartiallySignedTx(tx: Tx, uTxOutMap?: TxOutMap, sigOperations?: SigOperations): this;
      /**
       * Pay "from" a script - in other words, add an input to the transaction.
       */
      inputFromScript(txHashBuf: Buffer, txOutNum: number, txOut: TxOut, script: Script, nSequence?: number): this;
      addSigOperation(txHashBuf: Buffer, txOutNum: number, nScriptChunk: number, type: 'sig' | 'pubKey', addressStr: string, nHashType?: number): this;
      /**
       * Pay "from" a pubKeyHash output - in other words, add an input to the
       * transaction.
       */
      inputFromPubKeyHash(txHashBuf: Buffer, txOutNum: number, txOut: TxOut, pubKey?: PubKey, nSequence?: number, nHashType?: number): this;
      /**
       * An address to send funds to, along with the amount. The amount should be
       * denominated in satoshis, not bitcoins.
       */
      outputToAddress(valueBn: Bn, addr: Address): this;
      /**
       * A script to send funds to, along with the amount. The amount should be
       * denominated in satoshis, not bitcoins.
       */
      outputToScript(valueBn: Bn, script: Script): this;
      buildOutputs(): Bn;
      buildInputs(outAmountBn: Bn, extraInputsNum?: number): Bn;
      estimateSize(): number;
      estimateFee(extraFeeAmount?: Bn): Bn;
      /**
       * Builds the transaction and adds the appropriate fee by subtracting from
       * the change output. Note that by default the TxBuilder will use as many
       * inputs as necessary to pay the output amounts and the required fee. The
       * TxBuilder will not necessarily us all the inputs. To force the TxBuilder
       * to use all the inputs (such as if you wish to spend the entire balance
       * of a wallet), set the argument useAllInputs = true.
       *
       * @returns Built transaction.
       */
      build(opts?: {
          useAllInputs: boolean;
      }): TxBuilder;
      sort(): this;
      /**
       * Check if all signatures are present in a multisig input script.
       */
      static allSigsPresent(m: number, script: Script): boolean;
      /**
       * Remove blank signatures in a multisig input script.
       */
      static removeBlankSigs(script: Script): Script;
      fillSig(nIn: number, nScriptChunk: number, sig: Sig): this;
      /**
       * Sign an input, but do not fill the signature into the transaction. Return
       * the signature.
       *
       * For a normal transaction, subScript is usually the scriptPubKey. If
       * you're not normal because you're using OP_CODESEPARATORs, you know what
       * to do.
       */
      getSig(keyPair: KeyPair, nHashType: number, nIn: number, subScript: Script, flags?: number): Sig;
      /**
       * Asynchronously sign an input in a worker, but do not fill the signature
       * into the transaction. Return the signature.
       */
      asyncGetSig(keyPair: KeyPair, nHashType: number, nIn: number, subScript: Script, flags?: number): Promise<Sig>;
      /**
       * Sign ith input with keyPair and insert the signature into the transaction.
       * This method only works for some standard transaction types. For
       * non-standard transaction types, use getSig.
       */
      signTxIn(nIn: number, keyPair: KeyPair, txOut: TxOut, nScriptChunk: number, nHashType?: number, flags?: number): this;
      /**
       * Asynchronously sign ith input with keyPair in a worker and insert the
       * signature into the transaction.  This method only works for some standard
       * transaction types. For non-standard transaction types, use asyncGetSig.
       */
      asyncSignTxIn(nIn: number, keyPair: KeyPair, txOut: TxOut, nScriptChunk: number, nHashType?: number, flags?: number): Promise<this>;
      signWithKeyPairs(keyPairs: KeyPair[]): this;
  }
  export {};
  //# sourceMappingURL=tx-builder.d.ts.map
}
declare module 'bsv/tx-builder.d.ts' {
 
}
declare module 'bsv/tx-in' {
  /// <reference types="node" />
  import { Br } from 'bsv/br';
  import { Bw } from 'bsv/bw';
  import { PubKey } from 'bsv/pub-key';
  import { Script } from 'bsv/script';
  import { Struct } from 'bsv/struct';
  import { TxOut } from 'bsv/tx-out';
  import { VarInt } from 'bsv/var-int';
  export interface TxInLike {
      txHashBuf: string;
      txOutNum: number;
      scriptVi: string;
      script: string;
      nSequence: number;
  }
  export class TxIn extends Struct {
      static readonly LOCKTIME_VERIFY_SEQUENCE: number;
      static readonly SEQUENCE_FINAL = 4294967295;
      static readonly SEQUENCE_LOCKTIME_DISABLE_FLAG: number;
      static readonly SEQUENCE_LOCKTIME_TYPE_FLAG: number;
      static readonly SEQUENCE_LOCKTIME_MASK = 65535;
      static readonly SEQUENCE_LOCKTIME_GRANULARITY = 9;
      txHashBuf: Buffer;
      txOutNum: number;
      scriptVi: VarInt;
      script: Script;
      nSequence: number;
      constructor(txHashBuf?: Buffer, txOutNum?: number, scriptVi?: VarInt, script?: Script, nSequence?: number);
      setScript(script: Script): this;
      fromProperties(txHashBuf: Buffer, txOutNum: number, script: Script, nSequence: number): this;
      static fromProperties(txHashBuf: Buffer, txOutNum: number, script: Script, nSequence?: number): TxIn;
      fromJSON(json: TxInLike): this;
      toJSON(): TxInLike;
      fromBr(br: Br): this;
      toBw(bw?: Bw): Bw;
      /**
       * Generate txIn with blank signatures from a txOut and its
       * txHashBuf+txOutNum. A "blank" signature is just an OP_0. The pubKey also
       * defaults to blank but can be substituted with the real public key if you
       * know what it is.
       */
      fromPubKeyHashTxOut(txHashBuf: Buffer, txOutNum: number, txOut: TxOut, pubKey: PubKey): this;
      hasNullInput(): boolean;
      /**
       * Analagous to bitcoind's SetNull in COutPoint
       */
      setNullInput(): void;
      /**
       * Get little-endian tx hash.
       */
      txid(): string;
  }
  //# sourceMappingURL=tx-in.d.ts.map
}
declare module 'bsv/tx-in.d.ts' {
 
}
declare module 'bsv/tx-out-map' {
  /// <reference types="node" />
  /**
   * Transaction Output Map
   * ======================
   *
   * A map from a transaction hash and output number to that particular output.
   * Note that the map is from the transaction *hash*, which is the value that
   * occurs in the blockchain, not the id, which is the reverse of the hash. The
   * TxOutMap is necessary when signing a transction to get the script and value
   * of that output which is plugged into the sighash algorithm.
   */
  import { Struct } from 'bsv/struct';
  import { Tx } from 'bsv/tx';
  import { TxOut } from 'bsv/tx-out';
  export interface TxOutMapLike {
      [label: string]: string;
  }
  export class TxOutMap extends Struct {
      map: Map<string, TxOut>;
      constructor(map?: Map<string, TxOut>);
      toJSON(): TxOutMapLike;
      fromJSON(json: TxOutMapLike): this;
      set(txHashBuf: Buffer, txOutNum: number, txOut: TxOut): this;
      get(txHashBuf: Buffer, txOutNum: number): TxOut;
      setTx(tx: Tx): this;
  }
  //# sourceMappingURL=tx-out-map.d.ts.map
}
declare module 'bsv/tx-out-map.d.ts' {
 
}
declare module 'bsv/tx-out' {
  /**
   * Transaction Output
   * ==================
   *
   * An output to a transaction. The way you normally want to make one is with
   * new TxOut(valueBn, script) (i.e., just as with TxIn, you can leave out the
   * scriptVi, since it can be computed automatically.
   */
  import { Bn } from 'bsv/bn';
  import { Br } from 'bsv/br';
  import { Bw } from 'bsv/bw';
  import { Script } from 'bsv/script';
  import { Struct } from 'bsv/struct';
  import { VarInt } from 'bsv/var-int';
  export interface TxOutLike {
      valueBn: string;
      scriptVi: string;
      script: string;
  }
  export class TxOut extends Struct {
      valueBn: Bn;
      scriptVi: VarInt;
      script: Script;
      constructor(valueBn?: Bn, scriptVi?: VarInt, script?: Script);
      setScript(script: Script): this;
      fromProperties(valueBn: Bn, script: Script): this;
      static fromProperties(valueBn: Bn, script: Script): TxOut;
      fromJSON(json: TxOutLike): this;
      toJSON(): TxOutLike;
      fromBr(br: Br): this;
      toBw(bw?: Bw): Bw;
  }
  //# sourceMappingURL=tx-out.d.ts.map
}
declare module 'bsv/tx-out.d.ts' {
 
}
declare module 'bsv/tx-verifier' {
  import { Interp } from 'bsv/interp';
  import { Struct } from 'bsv/struct';
  import { Tx } from 'bsv/tx';
  import { TxOutMap } from 'bsv/tx-out-map';
  export class TxVerifier extends Struct {
      tx: Tx;
      txOutMap: TxOutMap;
      errStr: string;
      interp: Interp;
      constructor(tx?: Tx, txOutMap?: TxOutMap, errStr?: string, interp?: Interp);
      /**
       * Verifies that the transaction is valid both by performing basic checks, such
       * as ensuring that no two inputs are the same, as well as by verifying every
       * script. The two checks are checkStr, which is analagous to bitcoind's
       * CheckTransaction, and verifyStr, which runs the script interpreter.
       *
       * This does NOT check that any possible claimed fees are accurate; checking
       * that the fees are accurate requires checking that the input transactions are
       * valid, which is not performed by this test. That check is done with the
       * normal verify function.
       */
      verify(flags?: number): boolean;
      asyncVerify(flags: number): Promise<boolean>;
      /**
       * Convenience method to verify a transaction.
       */
      static verify(tx: Tx, txOutMap: TxOutMap, flags?: number): boolean;
      static asyncVerify(tx: Tx, txOutMap: TxOutMap, flags: number): Promise<boolean>;
      /**
       * Check that a transaction passes basic sanity tests. If not, return a string
       * describing the error. This function contains the same logic as
       * CheckTransaction in bitcoin core.
       */
      checkStr(): boolean | string;
      /**
       * verify the transaction inputs by running the script interpreter. Returns a
       * string of the script interpreter is invalid, otherwise returns false.
       */
      verifyStr(flags: number): boolean | string;
      asyncVerifyStr(flags: number): Promise<boolean | string>;
      /**
       * Verify a particular input by running the script interpreter. Returns true if
       * the input is valid, false otherwise.
       */
      verifyNIn(nIn: number, flags: number): boolean;
      asyncVerifyNIn(nIn: number, flags: number): Promise<boolean>;
      getDebugObject(): {
          errStr: string;
          interpFailure: {
              errStr: string;
              scriptStr: string;
              pc: number;
              stack: string[];
              altStack: string[];
              opCodeStr: string;
          };
      };
      getDebugString(): string;
  }
  //# sourceMappingURL=tx-verifier.d.ts.map
}
declare module 'bsv/tx-verifier.d.ts' {
 
}
declare module 'bsv/tx' {
  /// <reference types="node" />
  /**
   * Transaction
   * ===========
   *
   * A bitcoin transaction.
   */
  import { Bn } from 'bsv/bn';
  import { Br } from 'bsv/br';
  import { Bw } from 'bsv/bw';
  import { HashCache } from 'bsv/hash-cache';
  import { KeyPair } from 'bsv/key-pair';
  import { PubKey } from 'bsv/pub-key';
  import { Script } from 'bsv/script';
  import { Sig } from 'bsv/sig';
  import { Struct } from 'bsv/struct';
  import { TxIn, TxInLike } from 'bsv/tx-in';
  import { TxOut, TxOutLike } from 'bsv/tx-out';
  import { VarInt } from 'bsv/var-int';
  export interface TxLike {
      versionBytesNum: number;
      txInsVi: string;
      txIns: TxInLike[];
      txOutsVi: string;
      txOuts: TxOutLike[];
      nLockTime: number;
  }
  export class Tx extends Struct {
      static readonly MAX_MONEY: number;
      static readonly SCRIPT_ENABLE_SIGHASH_FORKID: number;
      versionBytesNum: number;
      txInsVi: VarInt;
      txIns: TxIn[];
      txOutsVi: VarInt;
      txOuts: TxOut[];
      nLockTime: number;
      constructor(versionBytesNum?: number, txInsVi?: VarInt, txIns?: TxIn[], txOutsVi?: VarInt, txOuts?: TxOut[], nLockTime?: number);
      fromJSON(json: TxLike): this;
      toJSON(): TxLike;
      fromBr(br: Br): this;
      toBw(bw?: Bw): Bw;
      hashPrevouts(): Buffer;
      hashSequence(): Buffer;
      hashOutputs(): Buffer;
      /**
       * For a normal transaction, subScript is usually the scriptPubKey. For a
       * p2sh transaction, subScript is usually the redeemScript. If you're not
       * normal because you're using OP_CODESEPARATORs, you know what to do.
       */
      sighash(nHashType: number, nIn: number, subScript: Script, valueBn?: Bn, flags?: number, hashCache?: HashCache): Buffer;
      asyncSighash(nHashType: number, nIn: number, subScript: Script, valueBn?: Bn, flags?: number, hashCache?: HashCache): Promise<Buffer>;
      sighashPreimage(nHashType: number, nIn: number, subScript: Script, valueBn?: Bn, flags?: number, hashCache?: HashCache): Buffer;
      asyncSighashPreimage(nHashType: number, nIn: number, subScript: Script, valueBn?: Bn, flags?: number, hashCache?: HashCache): Promise<Buffer>;
      sign(keyPair: KeyPair, nHashType: number, nIn: number, subScript: Script, valueBn?: Bn, flags?: number, hashCache?: HashCache): Sig;
      asyncSign(keyPair: KeyPair, nHashType: number, nIn: number, subScript: Script, valueBn?: Bn, flags?: number, hashCache?: HashCache): Promise<Sig>;
      verify(sig: Sig, pubKey: PubKey, nIn: number, subScript: Script, enforceLowS?: boolean, valueBn?: Bn, flags?: number, hashCache?: HashCache): boolean;
      asyncVerify(sig: Sig, pubKey: PubKey, nIn: number, subScript: Script, enforceLowS?: boolean, valueBn?: Bn, flags?: number, hashCache?: HashCache): Promise<boolean>;
      hash(): Buffer;
      asyncHash(): Promise<Buffer>;
      id(): string;
      asyncId(): Promise<string>;
      addTxIn(txHashBuf: TxIn): this;
      addTxIn(txHashBuf: Buffer, txOutNum: number, script: Script, nSequence: number): this;
      addTxOut(valueBn: TxOut): this;
      addTxOut(valueBn: Bn, script: Script): this;
      /**
       * Analagous to bitcoind's IsCoinBase function in transaction.h
       */
      isCoinbase(): boolean;
      /**
       * BIP 69 sorting. Be sure to sign after sorting.
       */
      sort(): this;
  }
  //# sourceMappingURL=tx.d.ts.map
}
declare module 'bsv/tx.d.ts' {
 
}
declare module 'bsv/var-int' {
  /// <reference types="node" />
  /**
   * VarInt (a.k.a. Compact Size)
   * ============================
   *
   * A varInt is a varible sized integer, and it is a format that is unique to
   * bitcoin, and used throughout bitcoin to represent the length of binary data
   * in a compact format that can take up as little as 1 byte or as much as 9
   * bytes.
   */
  import { Bn } from 'bsv/bn';
  import { Br } from 'bsv/br';
  import { Struct } from 'bsv/struct';
  export class VarInt extends Struct {
      buf: Buffer;
      constructor(buf?: Buffer);
      fromJSON(json: string): this;
      toJSON(): string;
      fromBuffer(buf: Buffer): this;
      fromBr(br: Br): this;
      fromBn(bn: Bn): this;
      static fromBn(bn: Bn): VarInt;
      fromNumber(num: number): this;
      static fromNumber(num: number): VarInt;
      toBuffer(): Buffer;
      toBn(): Bn;
      toNumber(): number;
  }
  //# sourceMappingURL=var-int.d.ts.map
}
declare module 'bsv/var-int.d.ts' {
 
}
declare module 'bsv/version' {
  /// <reference types="node" />
  /**
   * Version
   * =======
   *
   * This data structure is used to specify details about what version of the
   * p2p network is supported by this or other nodes.
   */
  import { Bn } from 'bsv/bn';
  import { Br } from 'bsv/br';
  import { Bw } from 'bsv/bw';
  import { Struct } from 'bsv/struct';
  import { VarInt } from 'bsv/var-int';
  export class Version extends Struct {
      versionBytesNum: number;
      servicesBuf: Buffer;
      timeBn: Bn;
      addrRecvServicesBuf: Buffer;
      addrRecvIpAddrBuf: Buffer;
      addrRecvPort: number;
      addrTransServicesBuf: Buffer;
      addrTransIpAddrBuf: Buffer;
      addrTransPort: number;
      nonceBuf: Buffer;
      userAgentVi: VarInt;
      userAgentBuf: Buffer;
      startHeightNum: number;
      relay: boolean;
      constructor(versionBytesNum?: number, servicesBuf?: Buffer, timeBn?: Bn, addrRecvServicesBuf?: Buffer, addrRecvIpAddrBuf?: Buffer, addrRecvPort?: number, addrTransServicesBuf?: Buffer, addrTransIpAddrBuf?: Buffer, addrTransPort?: number, nonceBuf?: Buffer, userAgentVi?: VarInt, userAgentBuf?: Buffer, startHeightNum?: number, relay?: boolean);
      toBw(bw?: Bw): Bw;
      fromBr(br: Br): this;
  }
  //# sourceMappingURL=version.d.ts.map
}
declare module 'bsv/version.d.ts' {
 
}
declare module 'bsv/workers-result' {
  /// <reference types="node" />
  /**
   * WorkersResult
   * =============
   *
   * A response sent back from a worker to the main thread. Contains the "result"
   * of the computation in the form of a buffer, resbuf. If the actual result is
   * an object with a .toFastBuffer method, the object is converted to a buffer
   * using that method. Otherwise it is JSON serialized into a buffer. The result
   * can also be an error, in which case the isError flag is set.
   */
  import { Br } from 'bsv/br';
  import { Bw } from 'bsv/bw';
  import { Struct } from 'bsv/struct';
  export class WorkersResult extends Struct {
      resbuf: Buffer;
      isError: boolean;
      id: number;
      constructor(resbuf?: Buffer, isError?: boolean, id?: number);
      fromResult(result: Buffer | Struct | string, id: number): this;
      static fromResult(result: Buffer | Struct | string, id: number): WorkersResult;
      fromError(error: any, id: number): this;
      toBw(bw?: Bw): Bw;
      fromBr(br: Br): this;
  }
  //# sourceMappingURL=workers-result.d.ts.map
}
declare module 'bsv/workers-result.d.ts' {
 
}
declare module 'bsv/workers' {
  /**
   * Workers
   * =======
   *
   * Workers manages either processes (in node) or threads (in a browser). The
   * workers are intended to handle CPU-heavy tasks that block IO. This class is
   * a little unusual in that it must use different interfaces whether in node or
   * in the browser. In node, we use node's build-in child_process fork to create
   * new workers we can communicate with. In the browser, we use web workers.
   * Unfortunately, node and web browsers do not have a common interface for
   * workers. There is a node module called webworker-threads for node that
   * mimics the browser's web workers, but unfortunately it does not support
   * require(), and thus isn't very useful in our case. Therefore we fall back to
   * process forks.
   *
   * You probably don't need to use this class directly. Use Work, which will
   * automatically spawn new workers if needed.
   */
  import { WorkersResult } from 'bsv/workers-result';
  export class Workers {
      nativeWorkers: any[];
      lastid: number;
      incompconsteRes: any[];
      promisemap: Map<any, any>;
      constructor(nativeWorkers?: any[], lastid?: number, incompconsteRes?: any[], promisemap?: Map<any, any>);
      asyncObjectMethod(obj: any, methodname: string, args: any[], id?: number): WorkersResult;
      static asyncObjectMethod(obj: any, methodname: string, args: any[], id?: number): Promise<WorkersResult>;
      asyncClassMethod(classObj: any, methodname: string, args: any[], id?: number): WorkersResult;
      static asyncClassMethod(classObj: any, methodname: string, args: any[], id?: number): Promise<WorkersResult>;
      static endGlobalWorkers(): void;
  }
  //# sourceMappingURL=workers.d.ts.map
}
declare module 'bsv/workers.d.ts' {
 
}
declare module 'bsv' {
  import main = require('bsv/index');
  export = main;
}