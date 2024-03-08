import { JSError, isObject, toString } from '@noeldemartin/utils';
import { translateWithDefault } from '@/lang/utils';
import type { ErrorSource } from './Errors.state';

export function getErrorMessage(error: ErrorSource): string {
    if (typeof error === 'string') {
        return error;
    }

    if (error instanceof Error || error instanceof JSError) {
        return error.message;
    }

    if (isObject(error)) {
        return toString(error['message'] ?? error['description'] ?? 'Unknown error object');
    }

    return translateWithDefault('errors.unknown', 'Unknown Error');
}
