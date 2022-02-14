#! /usr/bin/pwsh

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$PSDefaultParameterValues['*:ErrorAction']='Stop'

yarn test --no-watch

if ($lastexitcode -ne 0) {
  throw ("Exec error")
}

yarn build

if ($lastexitcode -ne 0) {
  throw ("Exec error")
}

$version = (Get-Content package.json) -join "`n" | ConvertFrom-Json | Select -ExpandProperty "version"
if ($version -like '*rc*') { 
  echo "$version @next"
  npm publish --tag=next 
} else{
  echo $version
  npm publish 
}