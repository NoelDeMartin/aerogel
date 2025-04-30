import { Node, SyntaxKind } from 'ts-morph';
import { stringToCamelCase } from '@noeldemartin/utils';
import type { ArrayLiteralExpression, ImportDeclarationStructure, OptionalKind, SourceFile } from 'ts-morph';

import Log from '@aerogel/cli/lib/Log';
import Shell from '@aerogel/cli/lib/Shell';
import File from '@aerogel/cli/lib/File';
import { app, isLinkedLocalApp, isLocalApp } from '@aerogel/cli/lib/utils/app';
import { addNpmDependency } from '@aerogel/cli/utils/package';
import { editFiles, findDescendant, when } from '@aerogel/cli/lib/utils/edit';
import { packNotFound, packagePackPath, packagePath } from '@aerogel/cli/lib/utils/paths';
import type { Editor } from '@aerogel/cli/lib/Editor';

export default abstract class Plugin {

    public readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    public async install(options: { skipInstall?: boolean } = {}): Promise<void> {
        this.assertNotInstalled();

        await this.beforeInstall();
        await this.addDependencies();

        if (!options.skipInstall) {
            await this.installDependencies();
        }

        if (editFiles()) {
            const editor = app().edit();

            editor.addSourceFile('package.json');

            await this.updateFiles(editor);
            await editor.format();
        }

        await this.afterInstall();

        Log.info(`Plugin ${this.name} installed!`);
    }

    protected assertNotInstalled(): void {
        if (File.contains('package.json', `"${this.getNpmPackageName()}"`)) {
            Log.fail(`${this.name} is already installed!`);
        }
    }

    protected async beforeInstall(): Promise<void> {
        // Placeholder for overrides, don't place any functionality here.
    }

    protected async afterInstall(): Promise<void> {
        // Placeholder for overrides, don't place any functionality here.
    }

    protected async addDependencies(): Promise<void> {
        Log.info('Adding plugin dependencies');
        this.addNpmDependencies();
    }

    protected async installDependencies(): Promise<void> {
        await Log.animate('Installing plugin dependencies', async () => {
            await Shell.run('pnpm install --no-save');
        });
    }

    protected async updateFiles(editor: Editor): Promise<void> {
        if (this.isForDevelopment()) {
            return;
        }

        await this.updateBootstrapConfig(editor);
    }

    protected addNpmDependencies(): void {
        if (isLinkedLocalApp()) {
            addNpmDependency(
                this.getNpmPackageName(),
                `file:${packagePath(this.getLocalPackageName())}`,
                this.isForDevelopment(),
            );

            return;
        }

        if (isLocalApp()) {
            const packPath = packagePackPath(this.getLocalPackageName()) ?? packNotFound(this.getLocalPackageName());

            addNpmDependency(this.getNpmPackageName(), `file:${packPath}`, this.isForDevelopment());

            return;
        }

        addNpmDependency(this.getNpmPackageName(), 'next', this.isForDevelopment());
    }

    protected async updateBootstrapConfig(editor: Editor): Promise<void> {
        await Log.animate('Injecting plugin in bootstrap configuration', async () => {
            const mainConfig = editor.requireSourceFile('src/main.ts');
            const pluginsArray = this.getBootstrapPluginsDeclaration(mainConfig);

            if (!pluginsArray) {
                return Log.fail(`
                    Could not find plugins array in bootstrap config, please add the following manually:

                    ${this.getBootstrapConfig()}
                `);
            }

            mainConfig.addImportDeclaration(this.getBootstrapImport());
            pluginsArray.addElement(this.getBootstrapConfig());

            await editor.save(mainConfig);
        });
    }

    protected getBootstrapPluginsDeclaration(mainConfig: SourceFile): ArrayLiteralExpression | null {
        const bootstrapAppCall = findDescendant(mainConfig, {
            guard: Node.isCallExpression,
            validate: (callExpression) => callExpression.getExpression().getText() === 'bootstrap',
            skip: SyntaxKind.ImportDeclaration,
        });
        const bootstrapOptions = bootstrapAppCall?.getArguments()[1];
        const pluginsOption = when(bootstrapOptions, Node.isObjectLiteralExpression)?.getProperty('plugins');
        const pluginsArray = when(pluginsOption, Node.isPropertyAssignment)?.getInitializer();

        if (!Node.isArrayLiteralExpression(pluginsArray)) {
            return null;
        }

        return pluginsArray;
    }

    protected getTailwindContentArray(tailwindConfig: SourceFile): ArrayLiteralExpression | null {
        const contentAssignment = findDescendant(tailwindConfig, {
            guard: Node.isPropertyAssignment,
            validate: (propertyAssignment) => propertyAssignment.getName() === 'content',
            skip: SyntaxKind.JSDoc,
        });
        const contentArray = contentAssignment?.getInitializer();

        if (!Node.isArrayLiteralExpression(contentArray)) {
            return null;
        }

        return contentArray;
    }

    protected getBootstrapImport(): OptionalKind<ImportDeclarationStructure> {
        return {
            defaultImport: stringToCamelCase(this.name),
            moduleSpecifier: `@aerogel/plugin-${this.name}`,
        };
    }

    protected getNpmPackageName(): string {
        return `@aerogel/${this.getLocalPackageName()}`;
    }

    protected getLocalPackageName(): string {
        return `plugin-${this.name}`;
    }

    protected isForDevelopment(): boolean {
        return false;
    }

    protected getBootstrapConfig(): string {
        return `${stringToCamelCase(this.name)}()`;
    }

}
