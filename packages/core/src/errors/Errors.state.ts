import type { JSError } from '@noeldemartin/utils';

import { defineServiceState } from '@aerogel/core/services';

export type ErrorSource = string | Error | JSError | unknown;

export interface ErrorReport {
    title: string;
    description?: string;
    details?: string;
    error?: Error | JSError | unknown;
}

export interface ErrorReportLog {
    report: ErrorReport;
    seen: boolean;
    date: Date;
}

export default defineServiceState({
    name: 'errors',
    initialState: {
        logs: [] as ErrorReportLog[],
        startupErrors: [] as ErrorReport[],
    },
    computed: {
        hasErrors: ({ logs }) => logs.length > 0,
        hasNewErrors: ({ logs }) => logs.some((error) => !error.seen),
        hasStartupErrors: ({ startupErrors }) => startupErrors.length > 0,
    },
});
