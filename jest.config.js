module.exports = {
	collectCoverageFrom: ["src/linksv/**/*.{js,jsx,ts,tsx}"],
	roots: ["<rootDir>/src/linksv"],
	preset: "ts-jest",
	transform: {
		"^.+\\.(ts|tsx)?$": "ts-jest",
		"^.+\\.(js|jsx)$": "babel-jest"
	},
	setupFiles: ["<rootDir>/scripts/setupTests.js"],
	testEnvironment: "jsdom",
	moduleDirectories: ["node_modules", "src/linksv", "."],
	modulePathIgnorePatterns: [".notest.ts"],
	moduleFileExtensions: ["web.js", "js", "json", "web.jsx", "jsx", "tsx", "ts", "node"]
};
