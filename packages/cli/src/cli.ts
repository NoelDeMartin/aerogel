import { Command } from 'commander';
import { existsSync, readFileSync } from 'node:fs';
import { facade, fail } from '@noeldemartin/utils';
import { URL, fileURLToPath } from 'node:url';

import { CreateCommand } from '@aerogel/cli/commands/create';
import { GenerateComponentCommand } from '@aerogel/cli/commands/generate-component';
import { GenerateModelCommand } from '@aerogel/cli/commands/generate-model';
import { GenerateServiceCommand } from '@aerogel/cli/commands/generate-service';
import { InfoCommand } from '@aerogel/cli/commands/info';
import { InstallCommand } from '@aerogel/cli/commands/install';

export class CLIService {

    public run(argv?: string[]): void {
        const program = new Command();

        program.name('gel').description('AerogelJS CLI').version(this.getVersion());

        CreateCommand.define(program);
        GenerateComponentCommand.define(program);
        GenerateModelCommand.define(program);
        GenerateServiceCommand.define(program);
        InfoCommand.define(program);
        InstallCommand.define(program);

        program.parse(argv);
    }

    public getVersion(): string {
        const errorMessage = 'Could not find CLI\'s version, please report this bug.';
        const packageJsonPath = fileURLToPath(new URL(/* @vite-ignore */ '../package.json', import.meta.url));

        if (!existsSync(packageJsonPath)) {
            throw new Error(errorMessage);
        }

        const packageJson = JSON.parse(readFileSync(packageJsonPath).toString()) as { version?: string };

        return packageJson.version ?? fail(errorMessage);
    }

}

export default facade(CLIService);
