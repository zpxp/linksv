const path = require("path");
const fs = require("fs-extra");
const paths = require("./paths");

function readDirectory(dir) {
	const recurse = sub => {
		const contents = fs.readdirSync(sub);
		let files = contents.filter(file => !fs.statSync(path.join(sub, file)).isDirectory()).map(x => path.resolve(sub, x));
		const folders = contents.filter(file => fs.statSync(path.join(sub, file)).isDirectory());
		folders.forEach(folder => {
			files = files.concat(recurse(path.join(sub, folder)));
		});
		return files;
	};

	const files = recurse(dir);
	return files.map(x => x.replace(paths.appSrc, "").replace(/^\/|^\\/, ""));
}

function getEntries(pattern, exclude) {
	const entries = [];

	readDirectory("src").forEach(file => {
		if (pattern.test(file) && (!exclude || !exclude.test(file))) {
			entries.push(path.resolve(paths.appSrc, file));
		}
	});
	return entries;
}

module.exports = { getEntries };
