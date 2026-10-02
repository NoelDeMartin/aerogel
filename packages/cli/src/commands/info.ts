import Command from '@aerogel/cli/commands/Command';
import Log from '@aerogel/cli/lib/Log';
import { cliPath } from '@aerogel/cli/lib/utils/paths';
export class InfoCommand extends Command {
    protected static override command: string = 'info';
    protected static override description: string = 'Show debugging information about the CLI';

    protected override async run(): Promise<void> {
        Log.info('[AerogelJS CLI info]');
        Log.info('Installation directory: ' + cliPath());
    }
}
