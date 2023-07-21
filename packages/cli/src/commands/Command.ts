import File from '@/lib/File';
import Log from '@/lib/Log';
import type { Constructor } from '@noeldemartin/utils';
import type { Command as CommanderCommand } from 'commander';

export type CommandConstructor<T extends Command = Command> = Constructor<T>;
export type CommandOptions = Record<string, string | { description: string; type?: string }>;

export default class Command {

    public static command: string = '';
    public static description: string = '';
    public static parameters: [string, string][] = [];
    public static options: CommandOptions = {};

    public static define(program: CommanderCommand): void {
        program = program.command(this.command).description(this.description);

        for (const [name, description] of this.parameters) {
            program = program.argument(`<${name}>`, description);
        }

        for (const [name, definition] of Object.entries(this.options)) {
            const description = typeof definition === 'string' ? definition : definition.description;
            const type = typeof definition === 'string' ? 'string' : definition.type ?? 'string';

            program = program.option(type === 'boolean' ? `--${name}` : `--${name} <${type}>`, description);
        }

        program = program.action((...args) => this.run.call(this, ...args));
    }

    public static async run<T extends CommandConstructor>(this: T, ...args: ConstructorParameters<T>): Promise<void> {
        const instance = new this(...args);

        await instance.run();
    }

    public async run(): Promise<void> {
        //
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
