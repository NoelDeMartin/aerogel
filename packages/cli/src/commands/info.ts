import Command from '@/commands/Command';
import Log from '@/lib/Log';

export class InfoCommand extends Command {

    protected static command: string = 'info';
    protected static description: string = 'Show debugging information about the CLI';

    protected async run(): Promise<void> {
        Log.info('[AerogelJS CLI info]');
        Log.info('Installation directory: ' + __dirname);
    }

}
