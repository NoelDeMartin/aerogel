import { Command } from 'commander';
import { facade } from '@noeldemartin/utils';
import { CreateCommand } from '@/commands/create';

export class CLIService {

    public run(argv?: string[]): void {
        const program = new Command();

        program.name('ag').description('AerogelJS CLI').version('0.0.0');

        program
            .command('create')
            .description('Create new AerogelJS app')
            .argument('<path>', 'Application path')
            .option('--name <string>', 'Application name')
            .action((path, options) => new CreateCommand(path, options).run());

        program.parse(argv);
    }

}

export default facade(new CLIService());
