// babel.config.js
module.exports = {
	env: {
		test: {
			presets: [
				[
					"@babel/preset-env",
					{
						targets: {
							node: "current"
						}
					}
				],
				"@babel/preset-typescript"
			]
		}
	},
	presets: [
		[
			"@babel/preset-env",
			{
				modules: false
			}
		],
	],
	plugins: [
		[
			"@babel/plugin-proposal-decorators",
			{
				legacy: true
			}
		],
		[
			"@babel/plugin-proposal-class-properties",
			{
				loose: false
			}
		],
		"@babel/plugin-syntax-dynamic-import"
	]
};
