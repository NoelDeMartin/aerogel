import { exec } from 'child_process';
import { facade } from '@noeldemartin/utils';

export class ShellService {

    private cwd: string | null = null;

    public setWorkingDirectory(cwd: string): void {
        this.cwd = cwd;
    }

    public async run(command: string): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            exec(command, { cwd: this.cwd ?? undefined }, (error) => {
                if (error) {
                    reject(error);

                    return;
                }

                resolve();
            });
        });
    }

}

export default facade(ShellService);
