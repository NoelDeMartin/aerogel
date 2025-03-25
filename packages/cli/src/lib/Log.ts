import chalk from 'chalk';
import { clearLine, cursorTo } from 'node:readline';
import { facade, stringMatchAll } from '@noeldemartin/utils';

export class LogService {

    protected renderInfo = chalk.hex('#00ffff');
    protected renderSuccess = chalk.hex('#00ff00');
    protected renderError = chalk.hex('#ff0000');

    public async animate<T>(message: string, operation: () => Promise<T>): Promise<T> {
        const updateStdout = (end: string = '', done: boolean = false) => {
            const progress =
                this.renderInfo(this.renderMarkdown(message) + (done ? '...' : '.'.repeat(frame % 4))) + end;

            this.stdout(progress);
        };

        let frame = 0;

        updateStdout();

        const interval = setInterval(() => (frame++, updateStdout()), 1000);
        const result = await operation();

        clearInterval(interval);
        updateStdout('\n', true);

        return result;
    }

    public info(message: string): void {
        this.log(this.renderMarkdown(message), this.renderInfo);
    }

    public error(message: string): void {
        this.log(this.renderMarkdown(message), this.renderError);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public fail<T = any>(message: string): T {
        this.error(message);

        process.exit(1);
    }

    public success(message: string): void {
        this.log(this.renderMarkdown(message), this.renderSuccess);
    }

    protected renderMarkdown(message: string): string {
        const matches = stringMatchAll<2>(message, /\*\*(.*)\*\*/g);

        for (const match of matches) {
            message = message.replace(match[0], chalk.bold(match[1]));
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

export default facade(LogService);
