import Command from '@aerogel/cli/commands/Command';
import type { CommandOptions } from '@aerogel/cli/commands/Command';
import type { Editor } from '@aerogel/cli/lib/Editor';
import File from '@aerogel/cli/lib/File';
import Log from '@aerogel/cli/lib/Log';
import Template from '@aerogel/cli/lib/Template';
import { app } from '@aerogel/cli/lib/utils/app';
import { editFiles, findDescendant } from '@aerogel/cli/lib/utils/edit';
import { templatePath } from '@aerogel/cli/lib/utils/paths';
import { arrayFrom, formatCodeBlock, stringToCamelCase, stringToStudlyCase } from '@noeldemartin/utils';
import { Node, SyntaxKind } from 'ts-morph';
import type { ObjectLiteralExpression, SourceFile } from 'ts-morph';

interface Options {
    module?: string;
}

export class GenerateServiceCommand extends Command {
    protected static override command: string = 'generate:service';
    protected static override description: string = 'Generate an AerogelJS Service';
    protected static override parameters: [string, string][] = [['name', 'Service name']];
    protected static override options: CommandOptions = {
        module: 'Create service in the given module',
    };

    private name: string;
    private options: Options;

    constructor(name: string, options: Options = {}) {
        super();

        this.name = name;
        this.options = options;
    }

    protected get servicesPath(): string {
        return `${this.getSourcePath(this.options.module)}/services`;
    }

    protected override async run(): Promise<void> {
        this.assertAerogelOrDirectory(this.servicesPath);

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
            if (File.exists(`${this.servicesPath}/${this.name}.ts`)) {
                Log.fail(`${this.name} service already exists!`);
            }

            const serviceFiles = Template.instantiate(templatePath('service'), this.servicesPath, {
                service: {
                    name: this.name,
                },
            });

            serviceFiles.forEach((file) => files.add(file));
        });
    }

    protected async registerService(editor: Editor): Promise<void> {
        await Log.animate('Registering service', async () => {
            if (!File.exists(`${this.servicesPath}/index.ts`)) {
                await this.createServicesIndex(editor);
            }

            const servicesIndex = editor.requireSourceFile(`${this.servicesPath}/index.ts`);
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
        const servicesType = this.options.module ? `${stringToStudlyCase(this.options.module)}Services` : 'AppServices';

        File.write(
            `${this.servicesPath}/index.ts`,
            formatCodeBlock(`
                export const services = {};

                export type ${servicesType} = typeof services;

                declare module '@aerogel/core' {
                    interface Services extends ${servicesType} {}
                }
            `),
        );

        editor.addSourceFile(`${this.servicesPath}/index.ts`);

        if (this.options.module) {
            return this.registerModuleServices(editor, this.options.module);
        }

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

    protected async registerModuleServices(editor: Editor, module: string): Promise<void> {
        const moduleIndexPath = `${this.getSourcePath(module)}/index.ts`;

        if (!File.exists(moduleIndexPath)) {
            File.write(
                moduleIndexPath,
                formatCodeBlock(`
                    import { defineModule } from '@aerogel/core';

                    import { services } from './services';

                    export default defineModule({ services });
                `),
            );

            editor.addSourceFile(moduleIndexPath);

            Log.info(
                `Module created at ${moduleIndexPath}, remember to add it to the bootstrap modules in src/main.ts.`,
            );

            return;
        }

        const moduleIndex = editor.requireSourceFile(moduleIndexPath);
        const moduleOptions = this.getModuleOptions(moduleIndex);

        if (!moduleOptions) {
            return Log.fail('Could not find options object in module definition, please add the services manually.');
        }

        moduleOptions.insertShorthandPropertyAssignment(0, { name: 'services' });
        moduleIndex.addImportDeclaration({
            namedImports: ['services'],
            moduleSpecifier: './services',
        });

        await editor.save(moduleIndex);
    }

    protected getModuleOptions(moduleIndex: SourceFile): ObjectLiteralExpression | null {
        const defineModuleCall = findDescendant(moduleIndex, {
            guard: Node.isCallExpression,
            validate: (callExpression) => callExpression.getExpression().getText() === 'defineModule',
            skip: SyntaxKind.ImportDeclaration,
        });
        const moduleOptions = defineModuleCall?.getArguments()[0];

        if (!Node.isObjectLiteralExpression(moduleOptions)) {
            return null;
        }

        return moduleOptions;
    }

    protected getBootstrapOptions(mainConfig: SourceFile): ObjectLiteralExpression | null {
        const bootstrapAppCall = findDescendant(mainConfig, {
            guard: Node.isCallExpression,
            validate: (callExpression) => callExpression.getExpression().getText() === 'bootstrap',
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
