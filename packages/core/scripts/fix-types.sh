#!/usr/bin/env bash

sed -i 's/declare module '"'"'@aerogel\/core\/[^'"'"']*'"'"'/declare module '"'"'@aerogel\/core'"'"'/g' dist/aerogel-core.d.ts
