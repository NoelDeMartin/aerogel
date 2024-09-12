import { JSError } from '@noeldemartin/utils';
import type { JSErrorOptions } from '@noeldemartin/utils';

function getErrorMessage(message: string, description?: string | null): string {
    if (!description) {
        return message;
    }

    return `${message} (${description})`;
}

export default class AuthenticationFailedError extends JSError {

    constructor(message: string, description?: string | null, options?: JSErrorOptions) {
        super(getErrorMessage(message), options);
    }

}
