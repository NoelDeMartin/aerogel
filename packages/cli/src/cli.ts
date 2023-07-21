import { Command } from 'commander';
import { CreateCommand } from '@/commands/create';
import { facade } from '@noeldemartin/utils';
import { GenerateComponentCommand } from '@/commands/generate-component';

export class CLIService {

    public run(argv?: string[]): void {
        const program = new Command();

        program.name('ag').description('AerogelJS CLI').version('0.0.0');

        CreateCommand.define(program);
        GenerateComponentCommand.define(program);

        program.parse(argv);
    }

}

export default facade(new CLIService());
