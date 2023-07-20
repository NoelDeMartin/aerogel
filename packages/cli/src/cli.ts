import { Command } from 'commander';
import { facade } from '@noeldemartin/utils';
import { CreateCommand } from '@/commands/create';
import { GenerateCommand } from '@/commands/generate';

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

        program
            .command('generate')
            .description('Generate AerogelJS files')
            .argument('<template>', 'Files template (component)')
            .argument('<name>', 'Template name')
            .option('--story', 'Create component story')
            .action((template, name, options) => new GenerateCommand(template, name, options).run());

        program.parse(argv);
    }

}

export default facade(new CLIService());
