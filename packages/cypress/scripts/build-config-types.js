#!/usr/bin/env node
const { resolve } = require('path');

require('@noeldemartin/scripts').apiExtractorBuildTypes({
    input: resolve(__dirname, '../src/plugin/index.ts'),
    output: resolve(__dirname, '../config.d.ts'),
    external: ['cypress-solid/config', '@simonsmith/cypress-image-snapshot/plugin'],
});
