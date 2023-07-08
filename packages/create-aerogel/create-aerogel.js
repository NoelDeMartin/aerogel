#!/usr/bin/env node
const { CLI } = require('@aerogel/cli');

CLI.run([...process.argv.slice(0, 2), 'create', ...process.argv.slice(2)]);
