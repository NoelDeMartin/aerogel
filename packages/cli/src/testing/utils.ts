import type { Constructor } from '@noeldemartin/utils';

import ProgramStub from '@/testing/stubs/ProgramStub';
import type Command from '@/commands/Command';

export type StubCommandRunner<T extends Constructor<Command>> = (...args: ConstructorParameters<T>) => Promise<void>;

export function stubCommandRunner<T extends Constructor<Command>>(commandClass: T): StubCommandRunner<T> {
    const program = new ProgramStub();

    (commandClass as unknown as typeof Command).define(program);

    return (...args) => program.run(...args);
}
