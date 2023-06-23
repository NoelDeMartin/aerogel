#!/usr/bin/env bash

# set up parameters
repository=noeldemartin/aerogel
domain=aerogel.js.org

set -e
rm -rf dist

# # build projects
npm run build -w docs
npm run build -w playground

# create bundle
mv packages/docs/dist dist
mv packages/playground/dist dist/playground

# prepare github pages
cd dist
echo $domain > CNAME
touch .nojekyll

# publish
git init
git checkout -b main
git add -A
git commit -m 'deploy'
git push -f "git@github.com:$repository.git" main:gh-pages

cd -
