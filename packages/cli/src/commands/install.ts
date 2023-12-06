import Command from '@/commands/Command';
import Log from '@/lib/Log';
import { Histoire } from '@/plugins/Histoire';
import { Solid } from '@/plugins/Solid';
import { Soukai } from '@/plugins/Soukai';
import type Plugin from '@/plugins/Plugin';

const plugins = [new Soukai(), new Solid(), new Histoire()].reduce(
    (pluginsObject, plugin) => Object.assign(pluginsObject, { [plugin.name]: plugin }),
    {} as Record<string, Plugin>,
);

export class InstallCommand extends Command {

    public static command: string = 'install';
    public static description: string = 'Install an AerogelJS plugin';
    public static parameters: [string, string][] = [['plugin', 'Plugin to install']];

    private plugin: Plugin;

    constructor(plugin: string) {
        super();

        this.plugin =
            plugins[plugin] ??
            Log.fail(`Plugin '${plugin}' doesn't exist. Available plugins: ${Object.keys(plugins).join(', ')}`);
    }

    public async run(): Promise<void> {
        await this.plugin.install();
    }

}
