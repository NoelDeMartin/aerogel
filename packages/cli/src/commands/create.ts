import App from '@/lib/App';
import Log from '@/lib/Log';
import Shell from '@/lib/Shell';

export interface Options {
    name?: string;
}

export class CreateCommand {

    private path: string;
    private options: Options;

    constructor(path: string, options: Options) {
        this.path = path;
        this.options = options;
    }

    public async run(): Promise<void> {
        const path = this.path;
        const name = this.options.name ?? 'Aerogel App';

        Shell.setWorkingDirectory(path);

        await this.createApp(name, path);
        await this.installDependencies();
        await this.initializeGit();

        Log.success([
            '',
            `That's it! You can start working on **${name}** doing the following:`,
            `    cd ${path}`,
            '    npm run dev',
            '',
            'Have fun!',
        ]);
    }

    protected async createApp(name: string, path: string): Promise<void> {
        Log.info(`Creating **${name}**...`);

        new App(name).create(path);
    }

    protected async installDependencies(): Promise<void> {
        await Log.animate('Installing dependencies', async () => {
            await Shell.run('npm install');
        });
    }

    protected async initializeGit(): Promise<void> {
        await Log.animate('Initializing git', async () => {
            await Shell.run('git init');
            await Shell.run('git add .');
            await Shell.run('git commit -m "Start"');
        });
    }

}
