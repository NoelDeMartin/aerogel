import { stringToSlug } from '@noeldemartin/utils';

import File from '@/lib/File';
import Log from '@/lib/Log';
import Template from '@/lib/Template';
import { basePath } from '@/lib/utils';

export default class App {

    constructor(public name: string) {}

    public create(path: string): void {
        if (File.exists(path) && (!File.isDirectory(path) || !File.isEmptyDirectory(path))) {
            Log.info(`Folder at '${path}' already exists!`);
            process.exit(1);
        }

        new Template(basePath('template')).instantiate(path, {
            app: {
                name: this.name,
                slug: stringToSlug(this.name),
            },
        });
    }

}
