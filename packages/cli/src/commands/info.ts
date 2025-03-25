import { URL, fileURLToPath } from 'node:url';

import Command from '@aerogel/cli/commands/Command';
import Log from '@aerogel/cli/lib/Log';
export class InfoCommand extends Command {

    protected static override command: string = 'info';
    protected static override description: string = 'Show debugging information about the CLI';

    protected override async run(): Promise<void> {
        Log.info('[AerogelJS CLI info]');
        Log.info('Installation directory: ' + fileURLToPath(new URL(/* @vite-ignore */ './', import.meta.url)));
    }

}
