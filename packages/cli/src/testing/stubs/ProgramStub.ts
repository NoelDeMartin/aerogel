import type { Command as Program } from 'commander';
import type { Constructor } from '@noeldemartin/utils';

import type Command from '@/commands/Command';

export default class ProgramStub<T extends Constructor<Command> = Constructor<Command>> {

    private runner?: (...args: ConstructorParameters<T>) => Promise<void>;

    public async run(...args: ConstructorParameters<T>): Promise<void> {
        await this.runner?.(...args);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public command(): any {
        return { description: () => this };
    }

    public argument(): this {
        return this;
    }

    public option(): this {
        return this;
    }

    public action(runner: Function): this {
        this.runner = runner as (...args: ConstructorParameters<T>) => Promise<void>;

        return this;
    }

}

export default interface ProgramStub extends Program {}
