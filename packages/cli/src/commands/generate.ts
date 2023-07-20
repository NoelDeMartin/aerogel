import File from '@/lib/File';
import Log from '@/lib/Log';
import Template from '@/lib/Template';
import { basePath } from '@/lib/utils';

export interface Options {
    story?: boolean;
}

export class GenerateCommand {

    private template: 'component';
    private name: string;
    private options: Options;

    constructor(template: 'component', name: string, options: Options = {}) {
        this.template = template;
        this.name = name;
        this.options = options;
    }

    public async run(): Promise<void> {
        switch (this.template) {
            case 'component':
                this.generateComponent();
                break;
            default:
                Log.fail(`Unsupported generator template '${this.template}'`);
        }
    }

    public generateComponent(): void {
        if (!File.exists('./src/components')) {
            File.makeDirectory('./src/components');
        }

        Template.instantiate(basePath('templates/component'), './src/components', {
            component: { name: this.name },
        });

        if (this.options.story) {
            Template.instantiate(basePath('templates/component-story'), './src/components', {
                component: { name: this.name },
            });
        }

        Log.info(`New component created at src/components/${this.name}.vue`);
    }

}
