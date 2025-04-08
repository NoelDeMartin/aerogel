import Plugin from '@aerogel/cli/plugins/Plugin';
import Shell from '@aerogel/cli/lib/Shell';

export default class Soukai extends Plugin {

    constructor() {
        super('soukai');
    }

    protected override async installNpmDependencies(): Promise<void> {
        await Shell.run('npm install soukai@next --save-exact');
        await super.installNpmDependencies();
    }

    protected override getBootstrapConfig(): string {
        return 'soukai({ models: import.meta.glob(\'@/models/*\', { eager: true }) })';
    }

}
