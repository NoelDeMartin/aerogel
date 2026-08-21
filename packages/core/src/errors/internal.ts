import type { ErrorSource } from '@aerogel/core/errors/Errors.state';

const startupErrors: ErrorSource[] = [];

export function queueStartupError(error: ErrorSource): void {
    startupErrors.push(error);
}

export function consumeStartupErrors(): ErrorSource[] {
    const consumedErrors = startupErrors.slice();

    startupErrors.length = 0;

    return consumedErrors;
}
