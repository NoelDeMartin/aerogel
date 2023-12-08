import { Command } from 'commander';
import { CreateCommand } from '@/commands/create';
import { facade } from '@noeldemartin/utils';
import { GenerateComponentCommand } from '@/commands/generate-component';
import { GenerateModelCommand } from '@/commands/generate-model';
import { GenerateOverridesCommand } from '@/commands/generate-overrides';
import { GenerateServiceCommand } from '@/commands/generate-service';
import { InstallCommand } from '@/commands/install';

export class CLIService {

    public run(argv?: string[]): void {
        const program = new Command();

        program.name('ag').description('AerogelJS CLI').version('0.0.0');

        CreateCommand.define(program);
        GenerateComponentCommand.define(program);
        GenerateModelCommand.define(program);
        GenerateOverridesCommand.define(program);
        GenerateServiceCommand.define(program);
        InstallCommand.define(program);

        program.parse(argv);
    }

}

export default facade(new CLIService());
