import { expect } from 'vitest';
import { facade } from '@noeldemartin/utils';

import { LogService } from './Log';

export class LogServiceMock extends LogService {

    private logs: string[] = [];

    public expectLogged(message: string): void {
        expect(this.logs, `Expected message "${message}" to have been logged`).toContain(message);
    }

    public expectLogLength(count: number): void {
        expect(this.logs, `Expected log to have length ${count}`).toHaveLength(count);
    }

    protected logLine(message: string): void {
        this.logs.push(message);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public fail<T = any>(message: string): T {
        throw new Error(`Fail: ${message}`);
    }

    protected stdout(): void {
        //
    }

}

export default facade(LogServiceMock);
