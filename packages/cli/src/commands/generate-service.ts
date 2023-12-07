import { arrayFrom, formatCodeBlock, stringToCamelCase } from '@noeldemartin/utils';
import { Node, SyntaxKind } from 'ts-morph';
import type { ObjectLiteralExpression, SourceFile } from 'ts-morph';

import Command from '@/commands/Command';
import File from '@/lib/File';
import Log from '@/lib/Log';
import Template from '@/lib/Template';
import { app } from '@/lib/utils/app';
import { templatePath } from '@/lib/utils/paths';
import { editFiles, findDescendant } from '@/lib/utils/edit';
import type { Editor } from '@/lib/Editor';

export class GenerateServiceCommand extends Command {

    protected static command: string = 'generate:service';
    protected static description: string = 'Generate an AerogelJS Service';
    protected static parameters: [string, string][] = [['name', 'Service name']];

    private name: string;

    constructor(name: string) {
        super();

        this.name = name;
    }

    protected async run(): Promise<void> {
        this.assertAerogelOrDirectory('src/services');

        const files = new Set<string>();
        const editor = app().edit();

        await this.createService(files);

        if (editFiles()) {
            await this.registerService(editor);
            await editor.format();
        }

        const filesList = arrayFrom(files)
            .map((file) => `- ${file}`)
            .join('\n');

        Log.info(`${this.name} service created successfully! The following files were created:\n\n${filesList}`);
    }

    protected async createService(files: Set<string>): Promise<void> {
        await Log.animate('Creating service', async () => {
            if (File.exists(`src/services/${this.name}.ts`)) {
                Log.fail(`${this.name} service already exists!`);
            }

            const serviceFiles = Template.instantiate(templatePath('service'), 'src/services', {
                service: {
                    name: this.name,
                },
            });

            serviceFiles.forEach((file) => files.add(file));
        });
    }

    protected async registerService(editor: Editor): Promise<void> {
        await Log.animate('Registering service', async () => {
            if (!File.exists('src/services/index.ts')) {
                await this.createServicesIndex(editor);
            }

            const servicesIndex = editor.requireSourceFile('src/services/index.ts');
            const servicesObject = this.getServicesObject(servicesIndex);

            if (!servicesObject) {
                return Log.fail('Could not find services object in services config, please add it manually.');
            }

            servicesIndex.addImportDeclaration({
                defaultImport: this.name,
                moduleSpecifier: `./${this.name}`,
            });
            servicesObject.addPropertyAssignment({
                name: `$${stringToCamelCase(this.name)}`,
                initializer: this.name,
            });

            await editor.save(servicesIndex);
        });
    }

    protected async createServicesIndex(editor: Editor): Promise<void> {
        File.write(
            'src/services/index.ts',
            formatCodeBlock(`
                export const services = {};

                export type AppServices = typeof services;

                declare module '@vue/runtime-core' {
                    interface ComponentCustomProperties extends AppServices {}
                }
            `),
        );

        editor.addSourceFile('src/services/index.ts');

        const mainConfig = editor.requireSourceFile('src/main.ts');
        const bootstrapOptions = this.getBootstrapOptions(mainConfig);

        if (!bootstrapOptions) {
            return Log.fail('Could not find options object in bootstrap config, please add the services manually.');
        }

        bootstrapOptions.insertShorthandPropertyAssignment(0, { name: 'services' });
        mainConfig.addImportDeclaration({
            namedImports: ['services'],
            moduleSpecifier: './services',
        });

        await editor.save(mainConfig);
    }

    protected getBootstrapOptions(mainConfig: SourceFile): ObjectLiteralExpression | null {
        const bootstrapAppCall = findDescendant(mainConfig, {
            guard: Node.isCallExpression,
            validate: (callExpression) => callExpression.getExpression().getText() === 'bootstrapApplication',
            skip: SyntaxKind.ImportDeclaration,
        });
        const bootstrapOptions = bootstrapAppCall?.getArguments()[1];

        if (!Node.isObjectLiteralExpression(bootstrapOptions)) {
            return null;
        }

        return bootstrapOptions;
    }

    protected getServicesObject(servicesIndex: SourceFile): ObjectLiteralExpression | null {
        const servicesDeclaration = findDescendant(servicesIndex, {
            guard: Node.isVariableDeclaration,
            validate: (variableDeclaration) => variableDeclaration.getName() === 'services',
        });
        const servicesObject = servicesDeclaration?.getInitializer();

        if (!Node.isObjectLiteralExpression(servicesObject)) {
            return null;
        }

        return servicesObject;
    }

}
