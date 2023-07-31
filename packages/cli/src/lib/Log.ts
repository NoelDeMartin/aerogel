import { facade, stringMatchAll } from '@noeldemartin/utils';
import { bold, hex } from 'chalk';
import { clearLine, cursorTo } from 'readline';

export class LogService {

    protected renderInfo = hex('#00ffff');
    protected renderSuccess = hex('#00ff00');
    protected renderError = hex('#ff0000');

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

    public info(message: string): void {
        this.log(this.renderMarkdown(message), this.renderInfo);
    }

    public error(message: string): void {
        this.log(this.renderMarkdown(message), this.renderError);
    }

    public fail(message: string): void {
        this.error(message);

        process.exit(1);
    }

    public success(message: string): void {
        this.log(this.renderMarkdown(message), this.renderSuccess);
    }

    protected renderMarkdown(message: string): string {
        const matches = stringMatchAll<2>(message, /\*\*(.*)\*\*/g);

        for (const match of matches) {
            message = message.replace(match[0], bold(match[1]));
        }

        return message;
    }

    protected log(message: string, formatMessage?: (message: string) => string): void {
        this.formatMessage(message).forEach((line) => {
            this.logLine(formatMessage ? formatMessage(line) : line);
        });
    }

    protected formatMessage(message: string): string[] {
        if (message[0] === '\n') {
            message = message.slice(1).trimEnd();

            const lines = message.split('\n');
            const firstLetter = message.trim()[0] ?? '';
            const indentation = lines.find((line) => line.trim().length > 0)?.indexOf(firstLetter) ?? 0;

            return lines.map((line) => line.slice(indentation));
        }

        return [message];
    }

    protected logLine(line: string): void {
        // eslint-disable-next-line no-console
        console.log(line);
    }

    protected stdout(message: string): void {
        cursorTo(process.stdout, 0);
        clearLine(process.stdout, 0);

        process.stdout.write(message);
    }

}

export default facade(new LogService());
