module.exports = {
	parser: "@typescript-eslint/parser", // Specifies the ESLint parser
	extends: [
		"plugin:react/recommended" // Uses the recommended rules from @eslint-plugin-react
		//"plugin:@typescript-eslint/recommended" // Uses the recommended rules from @typescript-eslint/eslint-plugin
	],
	plugins: ["@typescript-eslint"],
	parserOptions: {
		ecmaVersion: 11, // Allows for the parsing of modern ECMAScript features
		sourceType: "module", // Allows for the use of imports
		ecmaFeatures: {
			jsx: true // Allows for the parsing of JSX
		},
		project: "./tsconfig.json"
	},
	rules: {
		// Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
		// e.g. "@typescript-eslint/explicit-function-return-type": "off",
		"@typescript-eslint/ban-ts-ignore": "error",
		// indent: "off",
		// "@typescript-eslint/indent": ["warn", "tab", {  "ignoredNodes": ["ConditionalExpression"] }],
		"@typescript-eslint/no-empty-interface": "off",
		"@typescript-eslint/no-unused-vars": ["warn", { vars: "all", args: "after-used", ignoreRestSiblings: true }],
		"@typescript-eslint/no-use-before-define": "error",
		"@typescript-eslint/triple-slash-reference": "error",
		"@typescript-eslint/no-for-in-array": "error",
		"@typescript-eslint/no-use-before-define": "off",
		"@typescript-eslint/prefer-regexp-exec": "error",
		"@typescript-eslint/prefer-includes": "warn",
		"@typescript-eslint/no-unnecessary-type-assertion": "error",
		"@typescript-eslint/prefer-for-of": "warn",
		semi: "off",
		"@typescript-eslint/semi": ["error"],
		"@typescript-eslint/ban-types": [
			"error",
			{
				types: {
					String: {
						message: "Use string instead",
						fixWith: "string"
					}
				}
			}
		],
		"react/prop-types": "off",
		"react/jsx-fragments": ["error", "element"],
		"react/no-direct-mutation-state": "error",
		"react/no-redundant-should-component-update": "error",
		"react/no-typos": "warn",
		"react/no-string-refs": "error",
		"react/react-in-jsx-scope": "error",
		"react/require-optimization": "error",
		"react/self-closing-comp": "warn",
		"react/jsx-key": "error",
		"no-async-promise-executor": "error",
		"no-irregular-whitespace": "error",
		"no-sparse-arrays": "error",
		"no-unsafe-finally": "error",
		"no-unexpected-multiline": "error",
		"no-unsafe-negation": "error",
		"require-atomic-updates": "error",
		"use-isnan": "error",
		"block-scoped-var": "error",
		complexity: ["error", 20],
		curly: ["error", "all"],
		"dot-location": ["error", "property"],
		eqeqeq: "warn",
		"guard-for-in": "warn",
		"no-eval": "error",
		"no-lone-blocks": "warn",
		"no-loop-func": "error",
		"no-return-await": "warn",
		"no-sequences": "warn",
		"no-unmodified-loop-condition": "warn",
		"require-await": "warn",
		yoda: "warn",
		"no-lonely-if": "warn"
	},
	settings: {
		react: {
			version: "detect", // Tells eslint-plugin-react to automatically detect the version of React to use
			linkComponents: [
				// Components used as alternatives to <a> for linking, eg. <Link to={ url } />
				"Hyperlink",
				{ name: "Link", linkAttribute: "to" }
			]
		}
	}
};
