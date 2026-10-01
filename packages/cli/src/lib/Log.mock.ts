import { facade } from '@noeldemartin/utils';
import { expect } from 'vite-plus/test';

import { LogService } from './Log';

export class LogServiceMock extends LogService {
    private logs: string[] = [];

    public expectLogged(message: string): void {
        expect(this.logs, `Expected message "${message}" to have been logged`).toContain(message);
    }

    public expectLogLength(count: number): void {
        expect(this.logs, `Expected log to have length ${count}`).toHaveLength(count);
    }

    protected override logLine(message: string): void {
        this.logs.push(message);
    }

    // oxlint-disable-next-line typescript/no-explicit-any
    public override fail<T = any>(message: string): T {
        throw new Error(`Fail: ${message}`);
    }

    protected override stdout(): void {
        //
    }
}

export default facade(LogServiceMock);
