import Command from '@aerogel/cli/commands/Command';
import LocalFirst from '@aerogel/cli/plugins/LocalFirst';
import Log from '@aerogel/cli/lib/Log';
import Solid from '@aerogel/cli/plugins/Solid';
import Soukai from '@aerogel/cli/plugins/Soukai';
import type Plugin from '@aerogel/cli/plugins/Plugin';
import type { CommandOptions } from '@aerogel/cli/commands/Command';

const plugins = [new Soukai(), new Solid(), new LocalFirst()].reduce(
    (pluginsObject, plugin) => Object.assign(pluginsObject, { [plugin.name]: plugin }),
    {} as Record<string, Plugin>,
);
export interface Options {
    skipInstall?: boolean;
}

export class InstallCommand extends Command {

    protected static override command: string = 'install';
    protected static override description: string = 'Install an AerogelJS plugin';
    protected static override parameters: [string, string][] = [['plugin', 'Plugin to install']];
    protected static override options: CommandOptions = {
        skipInstall: {
            type: 'boolean',
            description: 'Skip installing dependencies, just add them to package.json',
        },
    };

    private options: Options;
    private plugin: Plugin;

    constructor(plugin: string, options: Options = {}) {
        super();

        this.options = options;
        this.plugin =
            plugins[plugin] ??
            Log.fail(`Plugin '${plugin}' doesn't exist. Available plugins: ${Object.keys(plugins).join(', ')}`);
    }

    protected override async run(): Promise<void> {
        await this.plugin.install({
            skipInstall: this.options.skipInstall,
        });
    }

}
