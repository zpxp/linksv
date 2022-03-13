const path = require("path");
const fs = require("fs");
const paths = require("./paths");
const webpack = require("webpack");
const packageJson = require("../package.json");
const PnpWebpackPlugin = require("pnp-webpack-plugin");
const utils = require("./utils");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CssAutoRequirePlugin = require("./autoRequireCssPlugin");
const ESLintPlugin = require("eslint-webpack-plugin");

const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== "false";

const appSrc = path.resolve(__dirname, "..", "src");
const appRoot = path.resolve(__dirname, "..");
const appNM = path.resolve(__dirname, "..", "node_modules");

const externals = fs.readdirSync("./node_modules").reduce((prev, next) => {
	return {
		...prev,
		[next]: {
			root: next,
			commonjs2: next,
			commonjs: next,
			amd: next
		}
	};
}, {});

/**
 * Create a build for a package that will run in a web enviroment
 * @param {string} entry
 * @param {string} outputFolder
 * @param {boolean} lib
 * @param {object?} overrideOpts
 */
function generateWebBuild(entry, outputFolder, lib, overrideOpts) {
	/** @type {webpack.Configuration} */
	const conf = {
		mode: "production",
		bail: true,
		entry: entry,
		externals,
		output: {
			// The build folder.
			path: outputFolder,
			filename: "index.js",
			library: packageJson.name,
			libraryTarget: "umd"
		},

		optimization: {
			minimize: !lib
		},
		resolve: {
			extensions: [".ts", ".tsx", ".js"],
			modules: ["node_modules", appNM, appSrc, appRoot]
		},
		module: {
			rules: [
				{ test: /\.js$|\.map$/, loader: "source-map-loader" },

				{ test: /\.tsx?$|\.jsx?$/, include: path.join(__dirname, "../src"), loader: "ts-loader" }
			]
		},
		plugins: [new ESLintPlugin()],
		...overrideOpts
	};

	return conf;
}

/**
 * Create a build for a package that will run in a node enviroment, such as webpack
 * @param {string} entry
 * @param {string} outputFolder
 * @param {boolean} lib
 * @param {object?} overrideOpts
 */
function generateNodeBuild(entry, outputFolder, lib, overrideOpts) {
	const nodeBuild = {
		mode: "production",
		bail: true,
		target: "node",
		entry: entry,
		externals,
		output: {
			// The build folder.
			path: outputFolder,
			filename: "index.js",
			library: packageJson.name,
			libraryTarget: "umd"
		},
		resolve: {
			extensions: [".ts", ".tsx", ".js"],
			modules: ["node_modules", appNM, appSrc, appRoot]
		},
		optimization: {
			minimize: !lib
		},
		module: {
			rules: [
				{ test: /\.js$|\.map$/, loader: "source-map-loader" },

				{ test: /\.tsx?$|\.jsx?$/, include: path.join(__dirname, "../src"), loader: "ts-loader" }
			]
		},
		plugins: [new ESLintPlugin()],
		...overrideOpts
	};

	return nodeBuild;
}

module.exports = { generateNodeBuild, generateWebBuild };
