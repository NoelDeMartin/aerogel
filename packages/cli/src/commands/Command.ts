import File from '@aerogel/cli/lib/File';
import Log from '@aerogel/cli/lib/Log';
import type { Constructor } from '@noeldemartin/utils';
import type { Command as CommanderCommand } from 'commander';

export type CommandConstructor<T extends Command = Command> = Constructor<T>;
export type CommandOptions = Record<string, string | { description: string; type?: string }>;

export default class Command {

    protected static command: string = '';
    protected static description: string = '';
    protected static parameters: [string, string][] = [];
    protected static options: CommandOptions = {};

    public static define(program: CommanderCommand): void {
        program = program.command(this.command).description(this.description);

        for (const [name, description] of this.parameters) {
            program = program.argument(`<${name}>`, description);
        }

        for (const [name, definition] of Object.entries(this.options)) {
            const description = typeof definition === 'string' ? definition : definition.description;
            const type = typeof definition === 'string' ? 'string' : (definition.type ?? 'string');

            program = program.option(type === 'boolean' ? `--${name}` : `--${name} <${type}>`, description);
        }

        program = program.action((...args) => this.run.call(this, ...args));
    }

    public static async run<T extends CommandConstructor>(this: T, ...args: ConstructorParameters<T>): Promise<void> {
        const instance = new this(...args);

        await instance.validate();
        await instance.run();
    }

    protected async validate(): Promise<void> {
        // Placeholder for overrides, don't place any functionality here.
    }

    protected async run(): Promise<void> {
        // Placeholder for overrides, don't place any functionality here.
    }

    protected assertAerogelOrDirectory(path?: string): void {
        const packageJson = File.read('package.json');

        if (packageJson?.includes('@aerogel/core')) {
            return;
        }

        if (path && File.isDirectory(path)) {
            return;
        }

        const message = path ? `${path} folder does not exist.` : 'package.json does not contain @aerogel/core.';

        Log.fail(`${message} Are you sure this is an Aerogel app?`);
    }

}
