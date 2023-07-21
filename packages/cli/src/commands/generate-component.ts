import Command from '@/commands/Command';
import File from '@/lib/File';
import Log from '@/lib/Log';
import Template from '@/lib/Template';
import { basePath } from '@/lib/utils';
import type { CommandOptions } from '@/commands/Command';

export interface Options {
    story?: boolean;
}

export class GenerateComponentCommand extends Command {

    public static command: string = 'generate:component';
    public static description: string = 'Generate an AerogelJS component';
    public static parameters: [string, string][] = [['name', 'Component name']];
    public static options: CommandOptions = {
        story: {
            description: 'Create component story using Histoire',
            type: 'boolean',
        },
    };

    private name: string;
    private options: Options;

    constructor(name: string, options: Options = {}) {
        super();

        this.name = name;
        this.options = options;
    }

    public async run(): Promise<void> {
        this.assertAerogelOrDirectory('src/components');
        this.options.story && this.assertHistoireInstalled();

        if (File.exists(`src/components/${this.name}.vue`)) {
            Log.fail(`${this.name} component already exists!`);
        }

        const files = Template.instantiate(basePath('templates/component'), 'src/components', {
            component: { name: this.name },
        });

        if (this.options.story) {
            const storyFiles = Template.instantiate(basePath('templates/component-story'), 'src/components', {
                component: { name: this.name },
            });

            files.push(...storyFiles);
        }

        const filesList = files.map((file) => `- ${file}`).join('\n');

        Log.info(`${this.name} component created successfully! The following files were created:\n\n${filesList}`);
    }

    protected assertHistoireInstalled(): void {
        if (!File.exists('src/main.histoire.ts')) {
            Log.fail('Histoire is not installed yet!');
        }
    }

}
