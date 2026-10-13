import { translateWithDefault } from '@aerogel/core/lang/utils';
import { JSError, isObject, toString } from '@noeldemartin/utils';

import type { ErrorReport, ErrorSource } from './Errors.state';

const handlers: ErrorHandler[] = [];

export type ErrorHandler = (error: ErrorSource) => string | undefined;

function stringifyErrorCause(cause: unknown): string {
    if (cause instanceof Error) {
        return cause.stack ?? `${cause.name}: ${cause.message}`;
    }

    if (typeof cause === 'string') {
        return cause;
    }

    try {
        return JSON.stringify(cause) ?? String(cause);
    } catch {
        return String(cause);
    }
}

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

export function getErrorReportSummary(report: ErrorReport): string {
    return report.description ? `${report.title}: ${report.description}` : report.title;
}

export function getErrorReportDetails(report: ErrorReport): string {
    const sections = report.details ? [report.details] : [];
    const visited = new Set<unknown>([report.error]);
    let cause = isObject(report.error) ? report.error.cause : undefined;

    while (cause && !visited.has(cause)) {
        visited.add(cause);
        sections.push(`Caused by: ${stringifyErrorCause(cause)}`);

        cause = isObject(cause) ? cause.cause : undefined;
    }

    return sections.join('\n\n');
}

export function getErrorReportDebugInformation(report: ErrorReport): string {
    return [getErrorReportSummary(report), getErrorReportDetails(report)].filter(Boolean).join('\n\n');
}
