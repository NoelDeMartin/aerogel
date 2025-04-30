import Plugin from '@aerogel/cli/plugins/Plugin';
import { addNpmDependency } from '@aerogel/cli/utils/package';

export default class Soukai extends Plugin {

    constructor() {
        super('soukai');
    }

    protected override addNpmDependencies(): void {
        addNpmDependency('soukai', 'next');

        super.addNpmDependencies();
    }

    protected override getBootstrapConfig(): string {
        return 'soukai({ models: import.meta.glob(\'@/models/*\', { eager: true }) })';
    }

}
