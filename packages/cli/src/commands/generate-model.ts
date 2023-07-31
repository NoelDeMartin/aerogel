import { stringToStudlyCase } from '@noeldemartin/utils';

import Command from '@/commands/Command';
import File from '@/lib/File';
import Log from '@/lib/Log';
import Template from '@/lib/Template';
import { basePath, formatCodeBlock } from '@/lib/utils';
import type { CommandOptions } from '@/commands/Command';

interface Options {
    fields?: string;
}

export class GenerateModelCommand extends Command {

    public static command: string = 'generate:model';
    public static description: string = 'Generate an AerogelJS model';
    public static parameters: [string, string][] = [['name', 'Model name']];
    public static options: CommandOptions = {
        fields: 'Create model with the given fields',
    };

    private name: string;
    private options: Options;

    constructor(name: string, options: Options = {}) {
        super();

        this.name = name;
        this.options = options;
    }

    public async run(): Promise<void> {
        this.assertAerogelOrDirectory('src/models');

        if (File.exists(`src/models/${this.name}.ts`)) {
            Log.fail(`${this.name} model already exists!`);
        }

        this.assertSoukaiInstalled();

        const files = Template.instantiate(basePath('templates/model'), 'src/models', {
            model: {
                name: this.name,
                fieldsDefinition: this.getFieldsDefinition(),
            },
            soukaiImports: this.options.fields ? 'FieldType, defineModelSchema' : 'defineModelSchema',
        });

        const filesList = files.map((file) => `- ${file}`).join('\n');

        Log.info(`${this.name} model created successfully! The following files were created:\n\n${filesList}`);
    }

    protected getFieldsDefinition(): string {
        if (!this.options.fields) {
            return '        //';
        }

        const code = this.options.fields
            .split(',')
            .map((field) => {
                const [name, type] = field.split(':');

                return {
                    name,
                    type: stringToStudlyCase(type ?? 'string'),
                };
            })
            .reduce((definition, field) => definition + `\n${field.name}: FieldType.${field.type},`, '');

        return formatCodeBlock(code, { indent: 8 });
    }

    protected assertSoukaiInstalled(): void {
        if (!File.contains('package.json', '"soukai"')) {
            Log.fail(`
                Soukai is not installed yet! You can install it doing the following:

                1. Run the following command:
                    npm install soukai @aerogel/plugin-soukai@next

                2. Add this to your plugins array in src/main.ts:
                    soukai({ models: import.meta.glob('@/models/*', { eager: true }) })
            `);
        }
    }

}
