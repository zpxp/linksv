module.exports = {
	collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}"],
	roots: ["<rootDir>/src"],
	resolver: "jest-pnp-resolver",
	setupFilesAfterEnv: ["<rootDir>/config/jest/setupTests.js"],
	testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(tsx?|jsx?)$",
	testPathIgnorePatterns: ["\\.notest\\."],
	testEnvironment: "jsdom",
	testURL: "http://localhost",
	transform: {
		"^.+\\.(js|jsx)$": "<rootDir>/node_modules/babel-jest",
		"^.+\\.(ts|tsx)$": "<rootDir>/node_modules/babel-jest",
		"^.+\\.css$": "<rootDir>/config/jest/cssTransform.js",
		"^(?!.*\\.(js|jsx|ts|tsx|css|json)$)": "<rootDir>/config/jest/fileTransform.js"
	},
	transformIgnorePatterns: ["[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$", "^.+\\.module\\.(css|sass|scss)$"],
	moduleNameMapper: {
		"^react-native$": "react-native-web",
		"^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy"
	},
	moduleDirectories: ["node_modules", "src"],
	moduleFileExtensions: ["web.js", "js", "json", "web.jsx", "jsx", "tsx", "ts", "node"]
};
