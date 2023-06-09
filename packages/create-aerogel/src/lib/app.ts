import { File } from '@/lib/filesystem/File';
import { Template } from '@/lib/template';
import { basePath } from '@/lib/utils';

export class App {

    constructor(public name: string) {}

    public create(path: string): void {
        if (File.exists(path)) {
            console.error(`Folder at '${path}' already exists!`);
            process.exit(1);
        }

        console.log(`Creating app ${this.name}...`);

        new Template(basePath('template')).instantiate(path);

        console.log('That\'s it! You can start running your app with the following commands:');
        console.log(`cd ${path}`);
        console.log('npm install');
        console.log('npm run dev');
    }

}
