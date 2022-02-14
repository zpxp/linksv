#!/usr/bin/pwsh


yarn init --yes

## add files and scripts to the new package.json
$jsonfile = '.\package.json'

$json = Get-Content $jsonfile | Out-String | ConvertFrom-Json

$arr = echo '{"arr": ["dist/**/*","lib/**/*"	]}' | ConvertFrom-Json
$json | Add-Member -Type NoteProperty -Name 'files' -Value $arr.arr

$arr2 = echo '{"scripts": {
		"analyze": "source-map-explorer dist/js/main.*",
		"build": "yarn install && node scripts/build.js",
		"test": "node scripts/test.js --passWithNoTests",
		"new-version-patch": " yarn version --new-version patch",
		"new-version": " yarn version"
	}}' | ConvertFrom-Json
$json | Add-Member -Type NoteProperty -Name 'scripts' -Value $arr2.scripts

$arr3 = echo '{"peerDependencies": {}}' | ConvertFrom-Json
$json | Add-Member -Type NoteProperty -Name 'peerDependencies' -Value $arr3.peerDependencies

$json.main = 'lib/index.js'
# side effects allows webpack to trim unused deps
$json | Add-Member -Type NoteProperty -Name 'sideEffects' -Value $false

$json | ConvertTo-Json | Set-Content $jsonfile

yarn add -D @babel/core@`^7.4.3 `
@babel/plugin-proposal-class-properties@7.4.0 `
@babel/plugin-proposal-decorators@7.4.0 `
@babel/plugin-syntax-dynamic-import@7.2.0 `
@babel/preset-env@7.4.3 `
@babel/preset-react@`^7.0.0 `
@babel/preset-typescript@`^7.3.3 `
@types/jest@`^24.0.11 `
@types/node@`^11.13.4 `
@types/webpack@4.4.27 `
babel@6.23.0 `
babel-core@6.26.3 `
babel-jest@24.7.1 `
babel-loader@8.0.5 `
babel-polyfill@6.26.0 `
@typescript-eslint/eslint-plugin `
@typescript-eslint/parser `
eslint `
eslint-loader `
eslint-plugin-react `
chalk@`^2.4.2 `
css-loader@`^2.1.1 `
file-loader@`^3.0.1 `
fs@`^0.0.1-security `
fs-extra@`^7.0.1 `
jest@`^24.7.1 `
jest-pnp-resolver@`^1.2.1 `
jest-resolve@`^24.7.1 `
jsdom@`^14.0.0 `
mini-css-extract-plugin@`^0.6.0 `
node-sass@`^4.11.0 `
path@`^0.12.7 `
pnp-webpack-plugin@1.4.1 `
postcss-flexbugs-fixes@`^4.1.0 `
postcss-loader@`^3.0.0 `
postcss-preset-env@`^6.6.0 `
sass-loader@`^7.1.0 `
terser-webpack-plugin@`^1.2.3 `
ts-loader@`^5.3.3 `
typescript@ `
webpack@4.30.0

$confirmation = Read-Host "Add react libs?  [y/n]"

while($confirmation -ne "y" -and $confirmation -ne "n")
{
	$confirmation = Read-Host "Add react libs?  [y/n]"
}

if ($confirmation -eq 'y') {
	# add react based libs
	yarn add -D @types/react `
	@types/react-css-modules `
	@types/react-dom 
	
	# add to deps
	yarn add react react-css-modules react-dom
}


# add git remote
$matches = git remote -v | Select-String -Pattern '(https|git)(.+)/(.+?)\.git'
$upstream = $matches.Matches.groups[1] +  $matches.Matches.groups[2] + '/npm-package-template.git'
git remote add upstream $upstream
echo "Added remote $upstream"
git fetch upstream


# switch to initial branch
git checkout -b v1