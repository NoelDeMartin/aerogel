import { arrayFrom, facade, stringMatchAll } from '@noeldemartin/utils';
import { bold, hex } from 'chalk';

export class LogService {

    protected renderInfo = hex('#00ffff');
    protected renderSuccess = hex('#00ff00');

    public async animate<T>(message: string, operation: () => Promise<T>): Promise<T> {
        const updateStdout = (end: string = '') => {
            const progress = this.renderInfo(this.renderMarkdown(message) + '.'.repeat(frame % 4)) + end;

            this.stdout(progress);
        };

        let frame = 0;

        updateStdout();

        const interval = setInterval(() => (frame++, updateStdout()), 1000);
        const result = await operation();

        clearInterval(interval);
        updateStdout('\n');

        return result;
    }

    public info(messages: string | string[]): void {
        arrayFrom(messages).forEach((message) => {
            this.log(this.renderInfo(this.renderMarkdown(message)));
        });
    }

    public success(messages: string | string[]): void {
        arrayFrom(messages).forEach((message) => {
            this.log(this.renderSuccess(this.renderMarkdown(message)));
        });
    }

    protected renderMarkdown(message: string): string {
        const matches = stringMatchAll<2>(message, /\*\*(.*)\*\*/g);

        for (const match of matches) {
            message = message.replace(match[0], bold(match[1]));
        }

        return message;
    }

    protected log(messages: string | string[]): void {
        // eslint-disable-next-line no-console
        arrayFrom(messages).forEach((message) => console.log(message));
    }

    protected stdout(message: string): void {
        process.stdout.cursorTo(0);
        process.stdout.clearLine(0);
        process.stdout.write(message);
    }

}

export default facade(new LogService());
