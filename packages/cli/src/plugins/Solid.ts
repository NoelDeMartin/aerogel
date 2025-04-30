import File from '@aerogel/cli/lib/File';
import Log from '@aerogel/cli/lib/Log';
import Plugin from '@aerogel/cli/plugins/Plugin';
import { addNpmDependency } from '@aerogel/cli/utils/package';
import type { Editor } from '@aerogel/cli/lib/Editor';

export default class Solid extends Plugin {

    constructor() {
        super('solid');
    }

    protected override async updateFiles(editor: Editor): Promise<void> {
        await this.updateNpmScripts(editor);
        await this.updateGitIgnore();
        await super.updateFiles(editor);
    }

    protected override addNpmDependencies(): void {
        addNpmDependency('soukai-solid', 'next');
        addNpmDependency('@noeldemartin/solid-utils', 'next');
        addNpmDependency('@solid/community-server', '7.1.6', true);

        super.addNpmDependencies();
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
                        'test:serve-app http-get://localhost:5001 test:serve-pod http-get://localhost:3000 cy:run",',
                )
                .replace(
                    '"dev": "vite",',
                    '"dev": "vite",\n' +
                        '"dev:serve-pod": "community-solid-server -c @css:config/file.json -f ./solid",',
                )
                .replace(
                    '"test:serve-app": "vite --port 5001 --mode testing"',
                    '"test:serve-app": "vite --port 5001 --mode testing",\n' +
                        '"test:serve-pod": "community-solid-server -l warn"',
                ),
        );

        editor.addModifiedFile('package.json');
    }

    protected async updateGitIgnore(): Promise<void> {
        Log.info('Updating .gitignore');

        const gitignore = File.read('.gitignore') ?? '';

        File.write('.gitignore', `${gitignore}/solid\n`);
    }

}
