import { arrayFrom } from '@noeldemartin/utils';

import Command from '@/commands/Command';
import File from '@/lib/File';
import Log from '@/lib/Log';
import Template from '@/lib/Template';
import { templatePath } from '@/lib/utils/paths';
import type { CommandOptions } from '@/commands/Command';

export interface Options {
    story?: boolean;
}

export class GenerateOverridesCommand extends Command {

    protected static command: string = 'generate:overrides';
    protected static description: string = 'Generate AerogelJS component overrides';

    protected static options: CommandOptions = {
        story: {
            description: 'Create overrides story using Histoire',
            type: 'boolean',
        },
    };

    private options: Options;

    constructor(options: Options = {}) {
        super();

        this.options = options;
    }

    protected async run(): Promise<void> {
        this.assertAerogelOrDirectory('src/components');
        this.assertHistoireInstalled();

        const files = new Set<string>();

        await this.createComponents(files);
        await this.createStory(files);

        const filesList = arrayFrom(files)
            .map((file) => `- ${file}`)
            .join('\n');

        Log.info(`Overrides created successfully! The following files were created:\n\n${filesList}`);
        Log.info('\nRemember to declare your components in main.ts and main.histoire.ts!');
    }

    protected assertHistoireInstalled(): void {
        if (!this.options.story) {
            return;
        }

        if (!File.contains('package.json', '"histoire"') && !File.contains('package.json', '"@aerogel/histoire"')) {
            Log.fail(`
                Histoire is not installed yet! You can install it running:
                npx gel install histoire
            `);
        }
    }

    protected async createComponents(files: Set<string>): Promise<void> {
        await Log.animate('Creating components', async () => {
            if (File.exists('src/components/ModalWrapper.vue')) {
                Log.fail('ModalWrapper component already exists!');
            }

            Template.instantiate(templatePath('overrides'), 'src').forEach((file) => files.add(file));
        });
    }

    protected async createStory(files: Set<string>): Promise<void> {
        if (!this.options.story) {
            return;
        }

        await Log.animate('Creating story', async () => {
            Template.instantiate(templatePath('overrides-story'), 'src/components/overrides/').forEach((file) =>
                files.add(file));
        });
    }

}
