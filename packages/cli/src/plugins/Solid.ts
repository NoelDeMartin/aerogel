import { Node, SyntaxKind } from 'ts-morph';
import type { ArrayLiteralExpression, Project, PropertyAssignment, SourceFile } from 'ts-morph';

import Plugin from '@/plugins/Plugin';
import Shell from '@/lib/Shell';
import Log from '@/lib/Log';
import { isLocalApp, packagePath } from '@/lib/utils';

export class Solid extends Plugin {

    constructor() {
        super('solid');
    }

    protected async updateFiles(project: Project): Promise<void> {
        await this.updateTailwindConfig(project);
        await super.updateFiles(project);
    }

    protected async installNpmDependencies(): Promise<void> {
        await Shell.run('npm install soukai-solid@next');
        await super.installNpmDependencies();
    }

    protected async updateTailwindConfig(project: Project): Promise<void> {
        await Log.animate('Updating tailwind configuration', async () => {
            const tailwindConfig = project.getSourceFileOrThrow('tailwind.config.js');
            const contentArray = this.getTailwindContentArray(tailwindConfig);
            const contentValue = isLocalApp()
                ? `'${packagePath('plugin-solid')}/dist/**/*.js'`
                : '\'./node_modules/@aerogel/plugin-solid/dist/**/*.js\'';

            if (!contentArray) {
                return Log.fail(`
                    Could not find content array in tailwind config, please add the following manually:

                    ${contentValue}
                `);
            }

            contentArray.addElement(contentValue);

            await this.saveFile(tailwindConfig);
        });
    }

    protected getTailwindContentArray(tailwindConfig: SourceFile): ArrayLiteralExpression | null {
        const contentAssignment = tailwindConfig.forEachDescendant((node, traversal) => {
            switch (node.getKind()) {
                case SyntaxKind.PropertyAssignment:
                    {
                        const propertyAssignment = node as PropertyAssignment;

                        if (propertyAssignment.getName() === 'content') {
                            return propertyAssignment;
                        }
                    }

                    break;
                case SyntaxKind.JSDoc:
                    traversal.skip();
                    break;
            }
        });

        const contentArray = contentAssignment?.getInitializer();

        if (!Node.isArrayLiteralExpression(contentArray)) {
            return null;
        }

        return contentArray;
    }

}
