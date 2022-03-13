module.exports = {
	collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}"],
	roots: ["<rootDir>/src"],
	preset: "ts-jest",
	transform: {
		"^.+\\.(ts|tsx)?$": "ts-jest",
		"^.+\\.(js|jsx)$": "babel-jest"
	},
	setupFiles: ["<rootDir>/scripts/setupTests.js"],
	testEnvironment: "jsdom",
	moduleDirectories: ["node_modules", "src", "."],
	modulePathIgnorePatterns: [".notest.ts"],
	moduleFileExtensions: ["web.js", "js", "json", "web.jsx", "jsx", "tsx", "ts", "node"]
};
