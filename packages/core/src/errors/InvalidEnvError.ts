import { JSError } from '@noeldemartin/utils';
import type { ZodError } from 'zod';

export default class InvalidEnvError extends JSError {

    constructor(public override readonly cause: ZodError) {
        super('Invalid environment configuration: ' + cause.message, { cause });
    }

}
