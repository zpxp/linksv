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
export type { IApiProvider } from "./IApiProvider";
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
