module.exports = {
	collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}"],
	roots: ["<rootDir>/src"],
	preset: 'ts-jest',

	moduleDirectories: ["node_modules", "src", "."],
	moduleFileExtensions: ["web.js", "js", "json", "web.jsx", "jsx", "tsx", "ts", "node"]
};
