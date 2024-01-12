import { Command } from 'commander';
import { facade, fail } from '@noeldemartin/utils';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

import { CreateCommand } from '@/commands/create';
import { GenerateComponentCommand } from '@/commands/generate-component';
import { GenerateModelCommand } from '@/commands/generate-model';
import { GenerateOverridesCommand } from '@/commands/generate-overrides';
import { GenerateServiceCommand } from '@/commands/generate-service';
import { InstallCommand } from '@/commands/install';

export class CLIService {

    public run(argv?: string[]): void {
        const program = new Command();

        program.name('gel').description('AerogelJS CLI').version(this.getVersion());

        CreateCommand.define(program);
        GenerateComponentCommand.define(program);
        GenerateModelCommand.define(program);
        GenerateOverridesCommand.define(program);
        GenerateServiceCommand.define(program);
        InstallCommand.define(program);

        program.parse(argv);
    }

    public getVersion(): string {
        const errorMessage = 'Could not find CLI\'s version, please report this bug.';
        const packageJsonPath = resolve(__dirname, '../package.json');

        if (!existsSync(packageJsonPath)) {
            throw new Error(errorMessage);
        }

        const packageJson = JSON.parse(readFileSync(packageJsonPath).toString()) as { version?: string };

        return packageJson.version ?? fail(errorMessage);
    }

}

export default facade(new CLIService());
