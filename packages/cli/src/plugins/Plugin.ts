import { Node, SyntaxKind } from 'ts-morph';
import type {
    ArrayLiteralExpression,
    CallExpression,
    ImportDeclarationStructure,
    OptionalKind,
    SourceFile,
} from 'ts-morph';

import Log from '@/lib/Log';
import Shell from '@/lib/Shell';
import File from '@/lib/File';
import { app, editFiles, isLinkedLocalApp, isLocalApp } from '@/lib/utils/app';
import { packNotFound, packagePackPath, packagePath } from '@/lib/utils/paths';
import type { Editor } from '@/lib/Editor';

function when<T extends Node>(node: Node | undefined, assertion: (node: Node) => node is T): T | undefined {
    if (!node || !assertion(node)) {
        return;
    }

    return node as T;
}

export default abstract class Plugin {

    public readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    public async install(): Promise<void> {
        this.assertNotInstalled();

        await this.installDependencies();

        if (editFiles()) {
            const editor = app().edit();

            await this.updateFiles(editor);
            await editor.format();
        }

        Log.info(`Plugin ${this.name} installed!`);
    }

    protected assertNotInstalled(): void {
        if (File.contains('package.json', `"${this.getNpmPackageName()}"`)) {
            Log.fail(`${this.name} is already installed!`);
        }
    }

    protected async installDependencies(): Promise<void> {
        await Log.animate('Installing plugin dependencies', async () => {
            await this.installNpmDependencies();
        });
    }

    protected async updateFiles(editor: Editor): Promise<void> {
        await this.updateBootstrapConfig(editor);
    }

    protected async installNpmDependencies(): Promise<void> {
        if (isLinkedLocalApp()) {
            await Shell.run(`npm install file:${packagePath(this.getLocalPackageName())}`);

            return;
        }

        if (isLocalApp()) {
            const packPath = packagePackPath(this.getLocalPackageName()) ?? packNotFound(this.getLocalPackageName());

            await Shell.run(`npm install file:${packPath}`);

            return;
        }

        await Shell.run(`npm install ${this.getNpmPackageName()}@next`);
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
        const bootstrapAppCall = mainConfig.forEachDescendant((node, traversal) => {
            switch (node.getKind()) {
                case SyntaxKind.CallExpression:
                    {
                        const callExpression = node as CallExpression;

                        if (callExpression.getExpression().getText() === 'bootstrapApplication') {
                            return callExpression;
                        }
                    }

                    break;
                case SyntaxKind.ImportDeclaration:
                    traversal.skip();
                    break;
            }
        });
        const bootstrapOptions = bootstrapAppCall?.getArguments()[1];
        const pluginsOption = when(bootstrapOptions, Node.isObjectLiteralExpression)?.getProperty('plugins');
        const pluginsArray = when(pluginsOption, Node.isPropertyAssignment)?.getInitializer();

        if (!Node.isArrayLiteralExpression(pluginsArray)) {
            return null;
        }

        return pluginsArray;
    }

    protected getBootstrapImport(): OptionalKind<ImportDeclarationStructure> {
        return {
            defaultImport: this.name,
            moduleSpecifier: `@aerogel/plugin-${this.name}`,
        };
    }

    protected getNpmPackageName(): string {
        return `@aerogel/${this.getLocalPackageName()}`;
    }

    protected getLocalPackageName(): string {
        return `plugin-${this.name}`;
    }

    protected getBootstrapConfig(): string {
        return `${this.name}()`;
    }

}
