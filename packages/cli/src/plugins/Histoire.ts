import File from '@/lib/File';
import Log from '@/lib/Log';
import Plugin from '@/plugins/Plugin';
import Shell from '@/lib/Shell';
import Template from '@/lib/Template';
import { isLinkedLocalApp } from '@/lib/utils/app';
import { packagePath, templatePath } from '@/lib/utils/paths';
import type { Editor } from '@/lib/Editor';

export class Histoire extends Plugin {

    private installedPatchPackage: boolean = false;
    private installedPostCSSPseudoClasses: boolean = false;

    constructor() {
        super('histoire');
    }

    public async beforeInstall(): Promise<void> {
        this.installedPatchPackage = false;
        this.installedPostCSSPseudoClasses = false;
    }

    protected async afterInstall(): Promise<void> {
        if (!this.installedPatchPackage) {
            return;
        }

        await Log.animate('Patching dependencies', async () => {
            await Shell.run('npx patch-package');
        });
    }

    protected async updateFiles(editor: Editor): Promise<void> {
        await this.updateTailwindConfig(editor, {
            content: isLinkedLocalApp()
                ? `'${packagePath('histoire')}/dist/**/*.js'`
                : '\'./node_modules/@aerogel/histoire/dist/**/*.js\'',
        });

        await this.updateNpmScripts(editor);
        await this.createConfigFiles();
        await super.updateFiles(editor);
    }

    protected async installNpmDependencies(): Promise<void> {
        // We need this specific version because we're patching it using patch-package
        await Shell.run('npm install histoire@0.17.6 --save-dev');

        if (!File.contains('package.json', '"patch-package"')) {
            await Shell.run('npm install patch-package --save-dev');

            this.installedPatchPackage = true;
        }

        if (!File.contains('package.json', '"postcss-pseudo-classes"')) {
            await Shell.run('npm install postcss-pseudo-classes --save-dev');

            this.installedPostCSSPseudoClasses = true;
        }

        await super.installNpmDependencies();
    }

    protected getLocalPackageName(): string {
        return this.name;
    }

    protected async updateNpmScripts(editor: Editor): Promise<void> {
        Log.info('Updating npm scripts...');

        const packageJson = File.read('package.json');

        if (!packageJson) {
            return Log.fail('Could not find package.json file');
        }

        File.write(
            'package.json',
            packageJson.replace(
                '"lint": "noeldemartin-lint src",',
                this.installedPatchPackage
                    ? '"histoire": "histoire dev", "lint": "noeldemartin-lint src", "postinstall": "patch-package",'
                    : '"histoire": "histoire dev", "lint": "noeldemartin-lint src",',
            ),
        );

        editor.addModifiedFile('package.json');
    }

    protected async createConfigFiles(): Promise<void> {
        Log.info('Creating config files...');

        Template.instantiate(templatePath('histoire'));

        if (this.installedPostCSSPseudoClasses) {
            Template.instantiate(templatePath('postcss-pseudo-classes'));
        }
    }

    protected isForDevelopment(): boolean {
        return true;
    }

}
