module.exports = {
	collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}"],
	roots: ["<rootDir>/src"],
	preset: 'ts-jest',
	setupFiles: ["<rootDir>/config/setupTests.js"],
	moduleDirectories: ["node_modules", "src", "."],
	moduleFileExtensions: ["web.js", "js", "json", "web.jsx", "jsx", "tsx", "ts", "node"]
};
