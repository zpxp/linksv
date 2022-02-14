#!/bin/bash

set -e

yarn init --yes

## add files and scripts to the new package.json
JSONFILE='./package.json'

echo $( jq '.scripts += {
		"analyze": "source-map-explorer dist/js/main.*",
		"build": "yarn install && node scripts/build.js",
		"test": "node scripts/test.js --passWithNoTests",
		"new-version-patch": " yarn version --new-version patch",
		"new-version": " yarn version"
 }' $JSONFILE ) > $JSONFILE

echo $( jq '.files += ["dist/**/*","lib/**/*"	]' $JSONFILE ) > $JSONFILE
echo $( jq '.peerDependencies += {}' $JSONFILE ) > $JSONFILE
echo $( jq '.main += "lib/index.js"' $JSONFILE ) > $JSONFILE
# side effects allows webpack to trim unused deps
echo $( jq ".sideEffects += false" $JSONFILE ) > $JSONFILE


yarn add -D @babel/core \
@babel/plugin-proposal-class-properties \
@babel/plugin-proposal-decorators \
@babel/plugin-syntax-dynamic-import \
@babel/preset-env \
@babel/preset-react \
@babel/preset-typescript \
@types/jest \
@types/node \
@types/webpack \
babel \
babel-core \
babel-jest \
babel-loader \
babel-polyfill \
@typescript-eslint/eslint-plugin  \
@typescript-eslint/parser  \
eslint  \
eslint-webpack-plugin \
eslint-plugin-react \
chalk@2.4.1 \
css-loader \
file-loader \
fs \
fs-extra \
jest \
jest-pnp-resolver \
jest-resolve \
jsdom \
mini-css-extract-plugin \
node-sass \
path \
pnp-webpack-plugin@1.4.1 \
postcss-flexbugs-fixes \
postcss-loader \
postcss-preset-env \
sass-loader \
terser-webpack-plugin \
ts-loader \
typescript \
webpack

# $confirmation = Read-Host "Add react libs?  [y/n]"

# while($confirmation -ne "y" -and $confirmation -ne "n")
# {
# 	$confirmation = Read-Host "Add react libs?  [y/n]"
# }

# if ($confirmation -eq 'y') {
# 	# add react based libs
# 	yarn add -D @types/react `
# 	@types/react-css-modules `
# 	@types/react-dom 
	
# 	# add to deps
# 	yarn add react react-css-modules react-dom
# }


# add git remote
matches = git remote -v | grep -oP '(https|git)([^/]+)/(.+?)\.git'
upstream = "$matches/npm-package-template.git"
git remote add upstream $upstream
echo "Added remote $upstream"
git fetch upstream

# switch to initial branch
git checkout -b v1