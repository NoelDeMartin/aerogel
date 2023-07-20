import { stringToSlug } from '@noeldemartin/utils';

import File from '@/lib/File';
import Log from '@/lib/Log';
import Template from '@/lib/Template';
import { basePath } from '@/lib/utils';

export default class App {

    constructor(public name: string) {}

    public create(path: string): void {
        if (File.exists(path) && (!File.isDirectory(path) || !File.isEmptyDirectory(path))) {
            Log.fail(`Folder at '${path}' already exists!`);
        }

        Template.instantiate(basePath('templates/app'), path, {
            app: {
                name: this.name,
                slug: stringToSlug(this.name),
            },
        });
    }

}
