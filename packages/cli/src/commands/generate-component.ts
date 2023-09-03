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
    public static parameters: [string, string][] = [
        ['path', 'Component path (relative to components folder; extension not necessary)'],
    ];

    public static options: CommandOptions = {
        story: {
            description: 'Create component story using Histoire',
            type: 'boolean',
        },
    };

    private path: string;
    private options: Options;

    constructor(path: string, options: Options = {}) {
        super();

        this.path = path;
        this.options = options;
    }

    public async run(): Promise<void> {
        this.assertAerogelOrDirectory('src/components');
        this.options.story && this.assertHistoireInstalled();

        if (File.exists(`src/components/${this.path}.vue`)) {
            Log.fail(`${this.path} component already exists!`);
        }

        const [directoryName, componentName] = this.parsePathComponents();
        const files = Template.instantiate(basePath('templates/component'), `src/components/${directoryName}`, {
            component: { name: componentName },
        });

        if (this.options.story) {
            const storyFiles = Template.instantiate(basePath('templates/component-story'), 'src/components', {
                component: { name: componentName },
            });

            files.push(...storyFiles);
        }

        const filesList = files.map((file) => `- ${file}`).join('\n');

        Log.info(`${componentName} component created successfully! The following files were created:\n\n${filesList}`);
    }

    protected assertHistoireInstalled(): void {
        if (!File.exists('src/main.histoire.ts')) {
            Log.fail('Histoire is not installed yet!');
        }
    }

    protected parsePathComponents(): [string, string] {
        const lastSlashIndex = this.path.lastIndexOf('/');

        return lastSlashIndex === -1
            ? ['', this.path]
            : [this.path.substring(0, lastSlashIndex), this.path.substring(lastSlashIndex + 1)];
    }

}
