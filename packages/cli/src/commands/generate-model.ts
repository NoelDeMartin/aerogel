import { formatCodeBlock, stringToStudlyCase } from '@noeldemartin/utils';

import Command from '@aerogel/cli/commands/Command';
import File from '@aerogel/cli/lib/File';
import Log from '@aerogel/cli/lib/Log';
import Template from '@aerogel/cli/lib/Template';
import { templatePath } from '@aerogel/cli/lib/utils/paths';
import type { CommandOptions } from '@aerogel/cli/commands/Command';

interface Options {
    fields?: string;
}

export class GenerateModelCommand extends Command {

    protected static override command: string = 'generate:model';
    protected static override description: string = 'Generate an AerogelJS Model';
    protected static override parameters: [string, string][] = [['name', 'Model name']];
    protected static override options: CommandOptions = {
        fields: 'Create model with the given fields',
    };

    private name: string;
    private options: Options;

    constructor(name: string, options: Options = {}) {
        super();

        this.name = name;
        this.options = options;
    }

    protected override async run(): Promise<void> {
        this.assertAerogelOrDirectory('src/models');

        if (File.exists(`src/models/${this.name}.ts`)) {
            Log.fail(`${this.name} model already exists!`);
        }

        this.assertSoukaiInstalled();

        const filesList = await Log.animate('Creating model', async () => {
            const files = Template.instantiate(templatePath('model'), 'src/models', {
                model: {
                    name: this.name,
                    fieldsDefinition: this.getFieldsDefinition(),
                },
                soukaiImports: this.options.fields ? 'FieldType, defineModelSchema' : 'defineModelSchema',
            });

            return files.map((file) => `- ${file}`).join('\n');
        });

        Log.info(`${this.name} model created successfully! The following files were created:\n\n${filesList}`);
    }

    protected getFieldsDefinition(): string {
        if (!this.options.fields) {
            return '        //';
        }

        const code = this.options.fields
            .split(',')
            .map((field) => {
                const [name, type, rules] = field.split(':');

                return {
                    name,
                    type: stringToStudlyCase(type ?? 'string'),
                    required: rules === 'required',
                };
            })
            .reduce((definition, field) => {
                const fieldDefinition = field.required
                    ? formatCodeBlock(`
                        ${field.name}: {
                            type: FieldType.${field.type},
                            required: true,
                        }
                    `)
                    : `${field.name}: FieldType.${field.type}`;

                return definition + `\n${fieldDefinition},`;
            }, '');

        return formatCodeBlock(code, { indent: 8 });
    }

    protected assertSoukaiInstalled(): void {
        if (!File.contains('package.json', '"soukai"') && !File.contains('package.json', '"@aerogel/plugin-soukai"')) {
            Log.fail(`
                Soukai is not installed yet! You can install it running:
                npx gel install soukai
            `);
        }
    }

}
