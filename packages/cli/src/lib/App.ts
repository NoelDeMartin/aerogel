import { stringToSlug } from '@noeldemartin/utils';

import File from '@aerogel/cli/lib/File';
import Log from '@aerogel/cli/lib/Log';
import Template from '@aerogel/cli/lib/Template';
import { packNotFound, packagePackPath, packagePath, templatePath } from '@aerogel/cli/lib/utils/paths';
import { Editor } from '@aerogel/cli/lib/Editor';

interface Dependencies {
    aerogelCli: string;
    aerogelCore: string;
    aerogelCypress: string;
    aerogelPluginI18n: string;
    aerogelPluginSoukai: string;
    aerogelVite: string;
}

export interface Options {
    local?: boolean;
    linkedLocal?: boolean;
}

export default class App {

    constructor(
        protected name: string,
        protected options: Options = {},
    ) {}

    public create(path: string): void {
        if (File.exists(path) && (!File.isDirectory(path) || !File.isEmptyDirectory(path))) {
            Log.fail(`Folder at '${path}' already exists!`);
        }

        Template.instantiate(templatePath('app'), path, {
            app: {
                name: this.name,
                slug: stringToSlug(this.name),
            },
            dependencies: this.getDependencies(),
            contentPath: this.options.linkedLocal
                ? `${packagePath('core')}/dist/**/*.js`
                : './node_modules/@aerogel/core/dist/**/*.js',
        });
    }

    public edit(): Editor {
        return new Editor();
    }

    protected getDependencies(): Dependencies {
        const withFilePrefix = <T extends Record<string, string>>(paths: T) =>
            Object.entries(paths).reduce(
                (pathsWithFile, [name, path]) => Object.assign(pathsWithFile, { [name]: `file:${path}` }) as T,
                {} as T,
            );

        if (this.options.linkedLocal) {
            return withFilePrefix({
                aerogelCli: packagePath('cli'),
                aerogelCore: packagePath('core'),
                aerogelCypress: packagePath('cypress'),
                aerogelPluginI18n: packagePath('plugin-i18n'),
                aerogelPluginSoukai: packagePath('plugin-soukai'),
                aerogelVite: packagePath('vite'),
            });
        }

        if (this.options.local) {
            return withFilePrefix({
                aerogelCli: packagePackPath('cli') ?? packNotFound('cli'),
                aerogelCore: packagePackPath('core') ?? packNotFound('core'),
                aerogelCypress: packagePackPath('cypress') ?? packNotFound('cypress'),
                aerogelPluginI18n: packagePackPath('plugin-i18n') ?? packNotFound('plugin-i18n'),
                aerogelPluginSoukai: packagePackPath('plugin-soukai') ?? packNotFound('plugin-soukai'),
                aerogelVite: packagePackPath('vite') ?? packNotFound('vite'),
            });
        }

        return {
            aerogelCli: 'next',
            aerogelCore: 'next',
            aerogelCypress: 'next',
            aerogelPluginI18n: 'next',
            aerogelPluginSoukai: 'next',
            aerogelVite: 'next',
        };
    }

}
