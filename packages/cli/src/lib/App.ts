import { resolve } from 'node:path';

import File from '@aerogel/cli/lib/File';
import Log from '@aerogel/cli/lib/Log';
import Template from '@aerogel/cli/lib/Template';
import { packNotFound, packagePackPath, packagePath, templatePath } from '@aerogel/cli/lib/utils/paths';
import { Editor } from '@aerogel/cli/lib/Editor';
import { simpleGit } from 'simple-git';

export interface Options {
    next?: boolean;
    local?: boolean;
    linkedLocal?: boolean;
}

export default class App {

    constructor(
        protected name: string,
        protected options: Options = {},
    ) {}

    public async create(path: string): Promise<void> {
        if (File.exists(path) && (!File.isDirectory(path) || !File.isEmptyDirectory(path))) {
            Log.fail(`Folder at '${path}' already exists!`);
        }

        // Clone repository
        await simpleGit().clone('https://github.com/NoelDeMartin/aerogel-template.git', path, {
            '--depth': 1,
        });

        File.delete(resolve(path, '.git'));

        // Apply replacements
        const dependencies = this.getDependencies();

        File.replace(
            resolve(path, 'vite.config.ts'),
            'Aerogel({ name: \'Aerogel\' })',
            `Aerogel({ name: '${this.name}' })`,
        );

        File.replace(resolve(path, 'src/lang/en.yaml'), 'title: \'App\'', `title: '${this.name}'`);

        for (const [name, version] of Object.entries(dependencies)) {
            File.replace(resolve(path, 'package.json'), new RegExp(`"${name}": ".*?"`, 'g'), `"${name}": "${version}"`);
        }

        // Copy template
        Template.instantiate(templatePath('app'), path, { app: { name: this.name } });
    }

    public edit(): Editor {
        return new Editor();
    }

    protected getDependencies(): Record<string, string> {
        const withFilePrefix = <T extends Record<string, string>>(paths: T) =>
            Object.entries(paths).reduce(
                (pathsWithFile, [name, path]) => Object.assign(pathsWithFile, { [name]: `file:${path}` }) as T,
                {} as T,
            );

        const dependencies: Record<string, string> = {};

        if (this.options.next) {
            dependencies['@aerogel/cli'] = 'next';
            dependencies['@aerogel/core'] = 'next';
            dependencies['@aerogel/cypress'] = 'next';
            dependencies['@aerogel/plugin-i18n'] = 'next';
            dependencies['@aerogel/plugin-local-first'] = 'next';
            dependencies['@aerogel/plugin-routing'] = 'next';
            dependencies['@aerogel/plugin-solid'] = 'next';
            dependencies['@aerogel/plugin-soukai'] = 'next';
            dependencies['@aerogel/vite'] = 'next';
            dependencies['@noeldemartin/solid-utils'] = 'next';
            dependencies['@noeldemartin/utils'] = 'next';
            dependencies['soukai-solid'] = 'next';
            dependencies['soukai'] = 'next';
        }

        if (this.options.linkedLocal) {
            Object.assign(
                dependencies,
                withFilePrefix({
                    '@aerogel/cli': packagePath('cli'),
                    '@aerogel/core': packagePath('core'),
                    '@aerogel/cypress': packagePath('cypress'),
                    '@aerogel/plugin-i18n': packagePath('plugin-i18n'),
                    '@aerogel/plugin-routing': packagePath('plugin-routing'),
                    '@aerogel/plugin-soukai': packagePath('plugin-soukai'),
                    '@aerogel/plugin-solid': packagePath('plugin-solid'),
                    '@aerogel/plugin-local-first': packagePath('plugin-local-first'),
                    '@aerogel/vite': packagePath('vite'),
                }),
            );
        } else if (this.options.local) {
            Object.assign(
                dependencies,
                withFilePrefix({
                    '@aerogel/cli': packagePackPath('cli') ?? packNotFound('cli'),
                    '@aerogel/core': packagePackPath('core') ?? packNotFound('core'),
                    '@aerogel/cypress': packagePackPath('cypress') ?? packNotFound('cypress'),
                    '@aerogel/plugin-i18n': packagePackPath('plugin-i18n') ?? packNotFound('plugin-i18n'),
                    '@aerogel/plugin-routing': packagePackPath('plugin-routing') ?? packNotFound('plugin-routing'),
                    '@aerogel/plugin-soukai': packagePackPath('plugin-soukai') ?? packNotFound('plugin-soukai'),
                    '@aerogel/plugin-solid': packagePackPath('plugin-solid') ?? packNotFound('plugin-solid'),
                    '@aerogel/plugin-local-first':
                        packagePackPath('plugin-local-first') ?? packNotFound('plugin-local-first'),
                    '@aerogel/vite': packagePackPath('vite') ?? packNotFound('vite'),
                }),
            );
        }

        return dependencies;
    }

}
