import { execSync } from 'child_process';
import { facade } from '@noeldemartin/utils';

export interface ExecOptions {
    path?: string;
}

export class ShellService {

    public run(command: string, options: ExecOptions = {}): string {
        return execSync(command, { cwd: options.path }).toString();
    }

}

export default facade(new ShellService());
