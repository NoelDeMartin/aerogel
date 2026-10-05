#!/usr/bin/env bash

sed -i 's/declare module '"'"'@aerogel\/core\/[^'"'"']*'"'"'/declare module '"'"'@aerogel\/core'"'"'/g' dist/index.d.ts
sed -i 's/$nextTick: nextTick;/$nextTick: typeof nextTick;/g' dist/index.d.ts
