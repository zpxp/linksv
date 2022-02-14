"use strict";

if (!Array.prototype.last) {
	Object.defineProperty(Array.prototype, "last", {
		value: function(num) {
			return this[this.length - 1 - (num ? num : 0)];
		},
		configurable: true,
		writable: true
	});
}
