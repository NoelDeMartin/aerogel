import App from '@/lib/App';

interface Options {
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
        const name = this.options.name ?? 'Aerogel App';
        const app = new App(name);

        app.create(this.path);
    }

}
