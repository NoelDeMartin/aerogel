import Plugin from '@/plugins/Plugin';
import Shell from '@/lib/Shell';

export class Soukai extends Plugin {

    constructor() {
        super('soukai');
    }

    protected async installNpmDependencies(): Promise<void> {
        await Shell.run('npm install soukai@next');
        await super.installNpmDependencies();
    }

    protected getBootstrapConfig(): string {
        return 'soukai({ models: import.meta.glob(\'@/models/*\', { eager: true }) })';
    }

}
