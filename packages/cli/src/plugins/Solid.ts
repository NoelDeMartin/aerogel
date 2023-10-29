import { Node, SyntaxKind } from 'ts-morph';
import type { ArrayLiteralExpression, SourceFile } from 'ts-morph';

import File from '@/lib/File';
import Log from '@/lib/Log';
import Plugin from '@/plugins/Plugin';
import Shell from '@/lib/Shell';
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
        await this.updateNpmScripts(editor);
        await this.updateGitIgnore();
        await super.updateFiles(editor);
    }

    protected async installNpmDependencies(): Promise<void> {
        await Shell.run('npm install soukai-solid@next --save-exact');
        await Shell.run('npm install @solid/community-server@7 --save');
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

    protected async updateNpmScripts(editor: Editor): Promise<void> {
        Log.info('Updating npm scripts...');

        const packageJson = File.read('package.json');

        if (!packageJson) {
            return Log.fail('Could not find package.json file');
        }

        File.write(
            'package.json',
            packageJson
                .replace(
                    '"cy:dev": "concurrently --kill-others \\"npm run test:serve-app\\" \\"npm run cy:open\\"",',
                    '"cy:dev": "concurrently --kill-others ' +
                        '\\"npm run test:serve-app\\" \\"npm run test:serve-pod\\" \\"npm run cy:open\\"",',
                )
                .replace(
                    '"cy:test": "start-server-and-test test:serve-app http-get://localhost:5001 cy:run",',
                    '"cy:test": "start-server-and-test ' +
                        'test:serve-app http-get://localhost:5001 test:serve-pod http-get://localhost:4000 cy:run",',
                )
                .replace(
                    '"dev": "vite",',
                    '"dev": "vite",\n' +
                        '"dev:serve-pod": "community-solid-server -c @css:config/file.json -p 4000 -f ./solid-data",',
                )
                .replace(
                    '"test:serve-app": "vite --port 5001"',
                    '"test:serve-app": "vite --port 5001",\n' +
                        '"test:serve-pod": "community-solid-server -p 4000 -l warn"',
                ),
        );

        editor.addModifiedFile('package.json');
    }

    protected async updateGitIgnore(): Promise<void> {
        Log.info('Updating .gitignore');

        File.write('.gitignore', 'solid-data\n');
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
