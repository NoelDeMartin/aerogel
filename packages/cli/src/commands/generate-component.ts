import { arrayFrom, stringToSlug } from '@noeldemartin/utils';
import { Node, SyntaxKind } from 'ts-morph';
import type { ArrayLiteralExpression, CallExpression, SourceFile } from 'ts-morph';

import Command from '@aerogel/cli/commands/Command';
import File from '@aerogel/cli/lib/File';
import Log from '@aerogel/cli/lib/Log';
import Template from '@aerogel/cli/lib/Template';
import { app } from '@aerogel/cli/lib/utils/app';
import { editFiles, findDescendant } from '@aerogel/cli/lib/utils/edit';
import { templatePath } from '@aerogel/cli/lib/utils/paths';

export interface Options {
    button?: boolean;
    checkbox?: boolean;
    input?: boolean;
    story?: boolean;
}

export class GenerateComponentCommand extends Command {

    protected static override command: string = 'generate:component';
    protected static override description: string = 'Generate an AerogelJS Component';
    protected static override parameters: [string, string][] = [
        ['path', 'Component path (relative to components folder; extension not necessary)'],
    ];

    private path: string;

    constructor(path: string) {
        super();

        this.path = path;
    }

    protected override async run(): Promise<void> {
        this.assertAerogelOrDirectory('src/components');

        const files = new Set<string>();
        const [directoryName, componentName] = this.parsePathComponents();

        await this.createComponent(directoryName, componentName, files);
        await this.declareComponents();

        const filesList = arrayFrom(files)
            .map((file) => `- ${file}`)
            .join('\n');

        Log.info(`${componentName} component created successfully! The following files were created:\n\n${filesList}`);
    }

    protected async createComponent(directoryName: string, componentName: string, files: Set<string>): Promise<void> {
        await Log.animate('Creating component', async () => {
            if (File.exists(`src/components/${this.path}.vue`)) {
                Log.fail(`${this.path} component already exists!`);
            }

            const componentFiles = Template.instantiate(templatePath('component'), `src/components/${directoryName}`, {
                component: {
                    name: componentName,
                    slug: stringToSlug(componentName),
                },
            });

            componentFiles.forEach((file) => files.add(file));
        });
    }

    protected async declareComponents(): Promise<void> {
        if (!editFiles()) {
            return;
        }

        const editor = app().edit();
        const viteConfig = editor.requireSourceFile('vite.config.ts');
        const componentDirsArray = this.getComponentDirsArray(viteConfig);

        if (!componentDirsArray) {
            return Log.fail('Could not find component dirs declaration in vite config!');
        }

        if (
            componentDirsArray
                .getDescendantsOfKind(SyntaxKind.StringLiteral)
                .some((literal) => literal.getText() === '\'src/components\'')
        ) {
            return;
        }

        await Log.animate('Updating vite config', async () => {
            componentDirsArray.addElement('\'src/components\'');

            await editor.save(viteConfig);
        });

        await editor.format();
    }

    protected getComponentDirsArray(viteConfig: SourceFile): ArrayLiteralExpression | null {
        const pluginCall = findDescendant(viteConfig, {
            guard: Node.isCallExpression,
            validate: (callExpression) => callExpression.getText().startsWith('Components('),
            skip: SyntaxKind.ImportDeclaration,
        });

        if (!pluginCall) {
            return null;
        }

        const dirsAssignment = findDescendant(pluginCall, {
            guard: Node.isPropertyAssignment,
            validate: (propertyAssignment) => propertyAssignment.getName() === 'dirs',
        });

        const dirsArray = dirsAssignment?.getInitializer();

        if (!Node.isArrayLiteralExpression(dirsArray)) {
            return this.declareComponentDirsArray(pluginCall);
        }

        return dirsArray;
    }

    protected declareComponentDirsArray(pluginCall: CallExpression): ArrayLiteralExpression | null {
        const pluginOptions = findDescendant(pluginCall, { guard: Node.isObjectLiteralExpression });
        const dirsAssignment = pluginOptions?.addPropertyAssignment({
            name: 'dirs',
            initializer: '[]',
        });

        return (dirsAssignment?.getInitializer() as ArrayLiteralExpression) ?? null;
    }

    protected parsePathComponents(): [string, string] {
        const lastSlashIndex = this.path.lastIndexOf('/');

        return lastSlashIndex === -1
            ? ['', this.path]
            : [this.path.substring(0, lastSlashIndex), this.path.substring(lastSlashIndex + 1)];
    }

}
