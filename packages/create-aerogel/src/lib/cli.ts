import minimist from 'minimist';
import { basename, resolve } from 'path';

import { App } from '@/lib/app';

interface CLIConfig {
    appName: string;
    targetPath: string;
}

export interface CLIArguments {
    //
}

function readConfig(): CLIConfig {
    const argv = minimist<CLIArguments>(process.argv.slice(2));
    const targetPath = resolve(process.cwd(), argv._[0]?.trim().replace(/\/+$/g, '') ?? '.');
    const appName = basename(targetPath);

    return {
        appName,
        targetPath,
    };
}

export function main(): void {
    const config = readConfig();
    const app = new App(config.appName);

    app.create(config.targetPath);
}
