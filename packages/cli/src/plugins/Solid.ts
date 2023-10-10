import { Node, SyntaxKind } from 'ts-morph';
import type { ArrayLiteralExpression, SourceFile } from 'ts-morph';

import Plugin from '@/plugins/Plugin';
import Shell from '@/lib/Shell';
import Log from '@/lib/Log';
import { findDescendant } from '@/lib/utils/edit';
import { isLinkedLocalApp } from '@/lib/utils/app';
import { packagePath } from '@/lib/utils/paths';
import type { Editor } from '@/lib/Editor';

export class Solid extends Plugin {

    constructor() {
        super('solid');
    }

    protected async updateFiles(editor: Editor): Promise<void> {
        await this.updateTailwindConfig(editor);
        await super.updateFiles(editor);
    }

    protected async installNpmDependencies(): Promise<void> {
        await Shell.run('npm install soukai-solid@next --save-exact');
        await super.installNpmDependencies();
    }

    protected async updateTailwindConfig(editor: Editor): Promise<void> {
        await Log.animate('Updating tailwind configuration', async () => {
            const tailwindConfig = editor.requireSourceFile('tailwind.config.js');
            const contentArray = this.getTailwindContentArray(tailwindConfig);
            const contentValue = isLinkedLocalApp()
                ? `'${packagePath('plugin-solid')}/dist/**/*.js'`
                : '\'./node_modules/@aerogel/plugin-solid/dist/**/*.js\'';

            if (!contentArray) {
                return Log.fail(`
                    Could not find content array in tailwind config, please add the following manually:

                    ${contentValue}
                `);
            }

            contentArray.addElement(contentValue);

            await editor.save(tailwindConfig);
        });
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

}
