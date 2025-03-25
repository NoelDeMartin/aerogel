import { JSError, isObject, toString } from '@noeldemartin/utils';
import { translateWithDefault } from '@aerogel/core/lang/utils';
import type { ErrorSource } from './Errors.state';

const handlers: ErrorHandler[] = [];

export type ErrorHandler = (error: ErrorSource) => string | undefined;

export function registerErrorHandler(handler: ErrorHandler): void {
    handlers.push(handler);
}

export function getErrorMessage(error: ErrorSource): string {
    for (const handler of handlers) {
        const result = handler(error);

        if (result) {
            return result;
        }
    }

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
