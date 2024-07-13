import { JSError } from '@noeldemartin/utils';
import type { JSErrorOptions } from '@noeldemartin/utils';

export default class AuthenticationFailedError extends JSError {

    public readonly description?: string | null;

    constructor(message: string, description?: string | null, options?: JSErrorOptions) {
        super(message, options);

        this.description = description;
    }

}
