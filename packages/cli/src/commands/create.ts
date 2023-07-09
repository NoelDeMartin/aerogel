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

    public run(): void {
        const path = this.path;
        const name = this.options.name ?? 'Aerogel App';

        Log.info(`Creating app ${name}...`);
        const app = new App(name);

        app.create(path);

        Log.info('Installing dependencies...');
        Shell.run('npm install', { path });

        Log.info('Initializing git...');
        Shell.run('git init', { path });
        Shell.run('git add .', { path });
        Shell.run('git commit -m "Start"', { path });

        Log.info([
            'That\'s it! You can start running your app with the following commands:',
            `cd ${path}`,
            'npm run dev',
        ]);
    }

}
