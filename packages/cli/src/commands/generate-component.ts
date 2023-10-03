import { arrayFrom } from '@noeldemartin/utils';
import { Node, SyntaxKind } from 'ts-morph';
import type { ArrayLiteralExpression, PropertyAssignment, SourceFile } from 'ts-morph';

import Command from '@/commands/Command';
import File from '@/lib/File';
import Log from '@/lib/Log';
import Template from '@/lib/Template';
import { app, editFiles } from '@/lib/utils/app';
import { basePath } from '@/lib/utils/paths';
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
        this.assertHistoireInstalled();

        const files = new Set<string>();
        const [directoryName, componentName] = this.parsePathComponents();

        await this.createComponent(directoryName, componentName, files);
        await this.createStory(componentName, files);
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

        if (!File.exists('src/main.histoire.ts')) {
            Log.fail('Histoire is not installed yet!');
        }
    }

    protected async createComponent(directoryName: string, componentName: string, files: Set<string>): Promise<void> {
        await Log.animate('Creating component', async () => {
            if (File.exists(`src/components/${this.path}.vue`)) {
                Log.fail(`${this.path} component already exists!`);
            }

            const componentFiles = Template.instantiate(
                basePath('templates/component'),
                `src/components/${directoryName}`,
                { component: { name: componentName } },
            );

            componentFiles.forEach((file) => files.add(file));
        });
    }

    protected async createStory(componentName: string, files: Set<string>): Promise<void> {
        if (!this.options.story) {
            return;
        }

        await Log.animate('Creating story', async () => {
            const storyFiles = Template.instantiate(basePath('templates/component-story'), 'src/components', {
                component: { name: componentName },
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
        const dirsAssignment = viteConfig.forEachDescendant((node, traversal) => {
            switch (node.getKind()) {
                case SyntaxKind.PropertyAssignment:
                    {
                        const propertyAssignment = node as PropertyAssignment;

                        if (propertyAssignment.getName() === 'dirs') {
                            return propertyAssignment;
                        }
                    }

                    break;
                case SyntaxKind.ImportDeclaration:
                    traversal.skip();
                    break;
            }
        });

        const dirsArray = dirsAssignment?.getInitializer();

        if (!Node.isArrayLiteralExpression(dirsArray)) {
            return null;
        }

        return dirsArray;
    }

    protected parsePathComponents(): [string, string] {
        const lastSlashIndex = this.path.lastIndexOf('/');

        return lastSlashIndex === -1
            ? ['', this.path]
            : [this.path.substring(0, lastSlashIndex), this.path.substring(lastSlashIndex + 1)];
    }

}
