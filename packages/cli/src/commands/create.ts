import { basename } from 'node:path';
import { stringToTitleCase } from '@noeldemartin/utils';

import App from '@aerogel/cli/lib/App';
import Command from '@aerogel/cli/commands/Command';
import Log from '@aerogel/cli/lib/Log';
import Shell from '@aerogel/cli/lib/Shell';
import type { CommandOptions } from '@aerogel/cli/commands/Command';

export interface Options {
    name?: string;
    local?: boolean;
    copy?: boolean;
}

export class CreateCommand extends Command {

    protected static override command: string = 'create';
    protected static override description: string = 'Create AerogelJS app';
    protected static override parameters: [string, string][] = [['path', 'Application path']];
    protected static override options: CommandOptions = {
        name: 'Application name',
        local: {
            type: 'boolean',
            description: 'Whether to create an app using local Aerogel packages (used for core development)',
        },
        copy: {
            type: 'boolean',
            description: 'Whether to create an app linked to local Aerogel packages (used in CI)',
        },
    };

    private path: string;
    private options: Options;

    constructor(path: string, options: Options = {}) {
        super();

        this.path = path;
        this.options = options;
    }

    protected override async run(): Promise<void> {
        const path = this.path;
        const name = this.options.name ?? stringToTitleCase(basename(path));

        Shell.setWorkingDirectory(path);

        await this.createApp(name, path);
        await this.installDependencies();
        await this.initializeGit();

        Log.success(`

            That's it! You can start working on **${name}** doing the following:

                cd ${path}
                npm run dev

            Have fun!
        `);
    }

    protected async createApp(name: string, path: string): Promise<void> {
        Log.info(`Creating **${name}**...`);

        new App(name, {
            local: this.options.local,
            linkedLocal: this.options.local && !this.options.copy,
        }).create(path);
    }

    protected async installDependencies(): Promise<void> {
        await Log.animate('Installing dependencies', async () => {
            await Shell.run('npm install');
        });
    }

    protected async initializeGit(): Promise<void> {
        await Log.animate('Initializing git', async () => {
            await Shell.run('git init');
            await Shell.run('git add .');
            await Shell.run('git commit -m "Start"');
        });
    }

}
