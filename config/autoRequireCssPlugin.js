const path = require("path");

// auto add require(...css) to the top of the bundle entry so we dont have to manually import css

class CssAutoRequirePlugin {
	constructor(options) {
		this.options = Object.assign(
			{
				packageJson: null
			},
			options
		);
	}

	apply(compiler) {
		// compiler.hooks was introduced in webpack4, older versions are not supported
		if (compiler.hooks === undefined) {
			throw new Error("CssAutoRequirePlugin requires webpack >= 4. Use an older versions of webpack");
		}

		compiler.hooks.emit.tapAsync("sw-plugin-emit", (compilation, callback) => {
			this.handleEmit(compilation, compiler, callback);
		});
	}

	handleEmit(compilation, compiler, callback) {
		this.processBundle(compilation, compiler)
			.then(s => {
				callback();
			})
			.catch(e => {
				callback(new Error("Something went wrong during the make event. " + e));
			});
	}

	processBundle(compilation, compiler) {
		return new Promise(resolve => {
			let cssAssets = Object.keys(compilation.assets).filter(x => /\.s?css$/.test(x));
			let outputBundle = compilation.assets[compilation.outputOptions.filename];
			const projDir = path.resolve(".");

			// require all css assets at top of file
			const newSource = `${cssAssets
				.map(
					css =>
						`require("${this.options.packageJson.name}/${compilation.outputOptions.path
							.replace(projDir, "")
							.replace(/^(\/|\\)/, "")
							.replace(/\\/g, "/")}/${css}");`
				)
				.join("\n")}
${outputBundle.source()}`;

			//make source point to new source
			compilation.assets[compilation.outputOptions.filename] = {
				...compilation.assets[compilation.outputOptions.filename],
				source: () => newSource,
				size: () => Buffer.byteLength(newSource, "utf8")
			};

			resolve();
		});
	}
}

module.exports = CssAutoRequirePlugin;
module.exports["default"] = CssAutoRequirePlugin;
