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

const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== "false";

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
			libraryTarget: lib ? "commonjs2" : "umd"
		},
		node: {
			process: false
		},
		optimization: {
			minimize: false,
			splitChunks: {
				cacheGroups: {
					styles: {
						name: "styles",
						test: /\.css$/,
						chunks: "all",
						enforce: true
					}
				}
			}
		},
		resolve: {
			modules: ["src/@types/**/*", "node_modules"],
			extensions: [".js", ".json", ".jsx", ".ts", ".tsx"],
			plugins: [PnpWebpackPlugin]
		},
		resolveLoader: {
			plugins: [
				// Also related to Plug'n'Play, but this time it tells Webpack to load its loaders
				// from the current package.
				PnpWebpackPlugin.moduleLoader(module)
			]
		},
		module: {
			strictExportPresence: true,
			rules: [
				{ parser: { requireEnsure: false } },
				{
					test: /\.tsx?$/,
					enforce: "pre",
					loader: "ts-loader",
					options: PnpWebpackPlugin.tsLoaderOptions({
						compilerOptions: {
							outDir: outputFolder,
							jsx: "react"
						}
					})
				},
				// First, run the linter.
				{
					test: /\.tsx?$/,
					enforce: "pre",
					exclude: /node_modules/,
					loader: "eslint-loader",
					include: paths.appSrc,
					options: {
						failOnError: true
					}
				},
				{
					// "oneOf" will traverse all following loaders until one will
					// match the requirements. When no loader matches it will fall
					// back to the "file" loader at the end of the loader list.
					oneOf: [
						{
							test: /\.(jsx?)$/,
							include: paths.appSrc,
							loader: require.resolve("babel-loader"),
							options: {
								plugins: [
									[
										require.resolve("./babel/babelAssetImporter"),
										{
											loaderMap: {
												svg: {
													ReactComponent: "@svgr/webpack?-prettier,-svgo![path]"
												}
											}
										}
									]
								],
								// This is a feature of `babel-loader` for webpack (not Babel itself).
								// It enables caching results in ./node_modules/.cache/babel-loader/
								// directory for faster rebuilds.
								cacheDirectory: true,
								// Don't waste time on Gzipping the cache
								cacheCompression: false
							}
						},
						// Process any JS outside of the app with Babel.
						// Unlike the application JS, we only compile the standard ES features.
						{
							test: /\.(js|mjs)$/,
							exclude: /@babel(?:\/|\\{1,2})runtime/,
							loader: require.resolve("babel-loader"),
							options: {
								babelrc: false,
								configFile: false,
								compact: false,
								cacheDirectory: true,
								// Don't waste time on Gzipping the cache
								cacheCompression: false,

								// If an error happens in a package, it's possible to be
								// because it was compiled. Thus, we don't want the browser
								// debugger to show the original code. Instead, the code
								// being evaluated would be much more helpful.
								sourceMaps: false
							}
						},

						{
							test: /\.scss$|\.css$/,
							exclude: /node_module|libs|\.nohash\.s?css$/,
							use: getStyleLoaders(true)
						},

						//dont hash node_modules or libs
						{
							test: /\.scss$|\.css$/,
							use: getStyleLoaders(false)
						},

						// "file" loader makes sure those assets get served by WebpackDevServer.
						// When you `import` an asset, you get its (virtual) filename.
						// In production, they would get copied to the `build` folder.
						// This loader doesn't use a "test" so it will catch all modules
						// that fall through the other loaders.
						{
							// Exclude `js` files to keep "css" loader working as it injects
							// its runtime that would otherwise be processed through "file" loader.
							// Also exclude `html` and `json` extensions so they get processed
							// by webpacks internal loaders.
							exclude: [/\.(js|mjs|jsx)$/, /\.html$/, /\.json$/, /\.tsx?$/],
							loader: require.resolve("file-loader"),
							options: {
								name: "media/[name].[hash:8].[ext]"
							}
						}
					]
				}
				// ** STOP ** Are you adding a new loader?
				// Make sure to add the new loader(s) before the "file" loader.
			]
		},
		plugins: [
			new MiniCssExtractPlugin({
				// Options similar to the same options in webpackOptions.output
				// both options are optional
				filename: "styles.css",
				chunkFilename: "styles.chunk.css"
			}),
			new CssAutoRequirePlugin({
				packageJson: packageJson
			})
		],
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
		node: {
			__dirname: false,
			process: false
		},
		output: {
			// The build folder.
			path: outputFolder,
			filename: "index.js",
			library: packageJson.name,
			libraryTarget: lib ? "commonjs2" : "umd"
		},
		resolve: {
			modules: ["src/@types/**/*", "node_modules"],
			extensions: [".js", ".json", ".jsx", ".ts", ".tsx"]
		},
		optimization: {
			minimize: false
		},
		module: {
			strictExportPresence: true,
			rules: [
				{ parser: { requireEnsure: false } },
				// First, run the linter.
				{
					test: /\.tsx?$/,
					enforce: "pre",
					exclude: /node_modules/,
					loader: "eslint-loader",
					include: paths.appSrc,
					options: {
						failOnError: true
					}
				},
				{
					test: /\.tsx?$/,
					loader: "ts-loader",
					options: PnpWebpackPlugin.tsLoaderOptions({
						compilerOptions: {
							outDir: outputFolder,
							jsx: "react"
						}
					})
				}
			]
		},
		plugins: [],
		...overrideOpts
	};

	return nodeBuild;
}

module.exports = { generateNodeBuild, generateWebBuild };

// common function to get style loaders
function getStyleLoaders(hashCSS) {
	const loaders = [
		{
			loader: MiniCssExtractPlugin.loader,
			options: {}
		},
		{
			loader: require.resolve("css-loader"),
			options: {
				importLoaders: 3,
				modules: hashCSS,
				sourceMap: true,
				localIdentName: packageJson.name.replace(/redi|-/g, "") + "_[local]___[hash:base64:7]"
			}
		},
		{
			// Options for PostCSS as we reference these options twice
			// Adds vendor prefixing based on your specified browser support in
			// package.json
			loader: require.resolve("postcss-loader"),
			options: {
				// Necessary for external CSS imports to work
				// https://github.com/facebook/create-react-app/issues/2677
				ident: "postcss",
				plugins: () => [
					require("postcss-flexbugs-fixes"),
					require("postcss-preset-env")({
						autoprefixer: {
							flexbox: "no-2009"
						},
						stage: 3
					})
				]
			}
		},
		{
			loader: "sass-loader", // compiles Sass to CSS,
			options: {
				sourceMap: true
			}
		},
		//custom IE prefix loader
		{
			loader: path.resolve("./config/cssTransformer"),
			options: {
				exclude: [/vars\.scss$|theme\.scss$/]
			}
		}
	];

	return loaders;
}
