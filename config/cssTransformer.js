"use strict";

const loaderUtils = require("loader-utils");
const validateOptions = require("schema-utils");
const paths = require("./paths");
const fs = require("fs-extra");
const path = require("path");

const themeFile = fs.existsSync(path.join(paths.appSrc, "theme.scss")) && {
	reg: /@import.*\/theme\.scss/,
	path: path.join(paths.appSrc, "theme.scss")
};
const varsFile = fs.existsSync(path.join(paths.appSrc, "vars.scss")) && {
	reg: /@import.*\/vars\.scss/,
	path: path.join(paths.appSrc, "vars.scss")
};

const regCheck = themeFile || varsFile;

const schema = {
	type: "object",
	properties: {
		exclude: {
			type: ["array"]
		}
	}
};

function cssTransformer(source) {
	const options = loaderUtils.getOptions(this);
	validateOptions(schema, options, "CSS Transformer");

	const interpolatedName = loaderUtils.interpolateName(this, "[path][name].[ext]", { content: source });

	//only works on scss files
	if (/\.scss$/.test(interpolatedName) && (options.exclude && options.exclude.every(x => !x.test(interpolatedName)))) {
		let hasImport = regCheck && regCheck.reg.test(source);

		const lines = source.split("\n");
		source = "";

		for (var index = 0, prev = "", line = lines[index]; index < lines.length; index++, prev = line, line = lines[index]) {
			//add a comment to the current line, or prev line, in css file, with "no CSS transform" in it to prevent this parsing
			if (!/no\sCSS\stransform/i.test(prev + line)) {
				//add IE flex transform
				if (regCheck && line.match(/(flex:(\s*)?(\d*))([\s]*)?(;|$|\n)/)) {
					line = line.replace(/(flex:(\s*)?(\d*))([\s]*)?(;|$|\n)/g, "$1; @include ifIE11() {flex: $3 1 auto;}");
					console.log(`Added '@include ifIE11() "flex"' to ${interpolatedName} L:${index + 1}`);
					//this mixin requires vars file. add it if not defined
					if (!hasImport) {
						source = `@import "${regCheck.path}";\n` + source;
						hasImport = true;
					}
				}

				//add mobile momentum scroll
				if (line.match(/(overflow:\s*?(auto|scroll))/)) {
					line = line.replace(/(overflow:\s*?(auto|scroll))/g, "$1; -webkit-overflow-scrolling: touch;");
					console.log(`Added '-webkit-overflow-scrolling: touch;' to ${interpolatedName} L:${index + 1}`);
				}
			}

			source += line + "\n";
		}
	}

	return source;
}

module.exports = cssTransformer;
