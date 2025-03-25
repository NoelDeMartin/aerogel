#!/usr/bin/env node
import { CLI } from '@aerogel/cli';

CLI.run([...process.argv.slice(0, 2), 'create', ...process.argv.slice(2)]);
