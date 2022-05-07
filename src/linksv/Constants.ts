const _IsProxy = Symbol("__linksv");
const _TemplateName = Symbol("__tname");
const _UnderlyingInst = Symbol("__proxinst");
const _SetState = Symbol("__setstate");
const _HasChanges = Symbol("__haschanges");
const _ExternalFunc = Symbol("__linkExternFunc");
const _ChainClass = Symbol("__chainClass");
const _HasProxy = Symbol("__hasProxy");

// this constants are internal only
export namespace Constants {
	export const IsProxy: unique symbol = _IsProxy as any;
	export const TemplateName: unique symbol = _TemplateName as any;
	export const UnderlyingInst: unique symbol = _UnderlyingInst as any;
	export const SetState: unique symbol = _SetState as any;
	export const HasChanges: unique symbol = _HasChanges as any;
	export const ExternalFunc: unique symbol = _ExternalFunc as any;
	export const HasProxy: unique symbol = _HasProxy as any;
	export const ChainClass: unique symbol = _ChainClass as any;
}

// these constants are available outside the library ie public
export namespace LinkSv {
	export const IsProxy: unique symbol = _IsProxy as any;
	export const TemplateName: unique symbol = _TemplateName as any;
	export const ChainClass: unique symbol = _ChainClass as any;
	export const HasChanges: unique symbol = _HasChanges as any;
}