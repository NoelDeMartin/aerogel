import Command from '@aerogel/cli/commands/Command';
import Log from '@aerogel/cli/lib/Log';
import { Solid } from '@aerogel/cli/plugins/Solid';
import { Soukai } from '@aerogel/cli/plugins/Soukai';
import type Plugin from '@aerogel/cli/plugins/Plugin';

const plugins = [new Soukai(), new Solid()].reduce(
    (pluginsObject, plugin) => Object.assign(pluginsObject, { [plugin.name]: plugin }),
    {} as Record<string, Plugin>,
);

export class InstallCommand extends Command {

    protected static override command: string = 'install';
    protected static override description: string = 'Install an AerogelJS plugin';
    protected static override parameters: [string, string][] = [['plugin', 'Plugin to install']];

    private plugin: Plugin;

    constructor(plugin: string) {
        super();

        this.plugin =
            plugins[plugin] ??
            Log.fail(`Plugin '${plugin}' doesn't exist. Available plugins: ${Object.keys(plugins).join(', ')}`);
    }

    protected override async run(): Promise<void> {
        await this.plugin.install();
    }

}
