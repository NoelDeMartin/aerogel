import { arrayFilter, arrayFrom, stringToSlug } from '@noeldemartin/utils';
import { Node, SyntaxKind } from 'ts-morph';
import type { ArrayLiteralExpression, CallExpression, SourceFile } from 'ts-morph';

import Command from '@aerogel/cli/commands/Command';
import File from '@aerogel/cli/lib/File';
import Log from '@aerogel/cli/lib/Log';
import Template from '@aerogel/cli/lib/Template';
import { app } from '@aerogel/cli/lib/utils/app';
import { editFiles, findDescendant } from '@aerogel/cli/lib/utils/edit';
import { templatePath } from '@aerogel/cli/lib/utils/paths';
import type { CommandOptions } from '@aerogel/cli/commands/Command';

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

    protected static override options: CommandOptions = {
        button: {
            description: 'Create a custom button',
            type: 'boolean',
        },
        checkbox: {
            description: 'Create a custom checkbox',
            type: 'boolean',
        },
        input: {
            description: 'Create a custom input',
            type: 'boolean',
        },
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

    protected override async validate(): Promise<void> {
        const components = arrayFilter([this.options.button, this.options.input, this.options.checkbox]).length;

        if (components > 1) {
            Log.fail('Can only use one of \'button\', \'input\', or \'checkbox\' flags!');
        }
    }

    protected override async run(): Promise<void> {
        this.assertAerogelOrDirectory('src/components');
        this.assertHistoireInstalled();

        const files = new Set<string>();
        const [directoryName, componentName] = this.parsePathComponents();

        await this.createComponent(directoryName, componentName, files);
        await this.createStory(directoryName, componentName, files);
        await this.declareComponents();

        const filesList = arrayFrom(files)
            .map((file) => `- ${file}`)
            .join('\n');

        Log.info(`${componentName} component created successfully! The following files were created:\n\n${filesList}`);
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

    protected async createComponent(directoryName: string, componentName: string, files: Set<string>): Promise<void> {
        await Log.animate('Creating component', async () => {
            if (File.exists(`src/components/${this.path}.vue`)) {
                Log.fail(`${this.path} component already exists!`);
            }

            const templateName = this.options.input
                ? 'component-input'
                : this.options.button
                    ? 'component-button'
                    : this.options.checkbox
                        ? 'component-checkbox'
                        : 'component';
            const componentFiles = Template.instantiate(templatePath(templateName), `src/components/${directoryName}`, {
                component: {
                    name: componentName,
                    slug: stringToSlug(componentName),
                },
            });

            componentFiles.forEach((file) => files.add(file));
        });
    }

    protected async createStory(directoryName: string, componentName: string, files: Set<string>): Promise<void> {
        if (!this.options.story) {
            return;
        }

        await Log.animate('Creating story', async () => {
            const templateName = this.options.input
                ? 'component-input-story'
                : this.options.button
                    ? 'component-button-story'
                    : this.options.checkbox
                        ? 'component-checkbox-story'
                        : 'component-story';
            const storyFiles = Template.instantiate(templatePath(templateName), `src/components/${directoryName}`, {
                component: {
                    name: componentName,
                    slug: stringToSlug(componentName),
                },
            });

            storyFiles.forEach((file) => files.add(file));
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
