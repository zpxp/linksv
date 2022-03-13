#! /bin/bash

set -e


yarn test --no-watch
yarn build

VERSION=`grep -oP '(?<="version"\: ")[^"]+' ./package.json `

if [ $VERSION  =~ rc]; then
  echo "$VERSION @next"
  npm publish --tag=next 
else
  echo $VERSION
  npm publish 
fi