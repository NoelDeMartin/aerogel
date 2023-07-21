import { expect } from 'vitest';
import { arrayFrom, facade } from '@noeldemartin/utils';

import { LogService } from './Log';

export class LogServiceMock extends LogService {

    private logs: string[] = [];

    public expectLogged(message: string): void {
        expect(this.logs, `Expected message "${message}" to have been logged`).toContain(message);
    }

    protected log(messages: string | string[]): void {
        this.logs.push(...arrayFrom(messages));
    }

    public fail(message: string): void {
        throw new Error(`Fail: ${message}`);
    }

    protected stdout(): void {
        //
    }

}

export default facade(new LogServiceMock());
