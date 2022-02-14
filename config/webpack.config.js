const generate = require("./buildTemplate")
const paths = require("./paths")

const builds = [
	/* 
	Example for a typical package build
	*/

	// create a dist build
	generate.generateWebBuild(paths.appIndexJs, paths.appBuildDist, false),
	// create a es6 module build
	generate.generateWebBuild(paths.appIndexJs, paths.appBuildLib, true)	
]

module.exports = builds;