import { defineServiceState } from '@aerogel/core/services/utils';

export type ErrorSource = unknown;

export interface ErrorReport {
    title: string;
    description?: string;
    details?: string;
    error?: unknown;
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
        debug: false,
    },
    computed: {
        hasErrors: ({ logs }) => logs.length > 0,
        hasNewErrors: ({ logs }) => logs.some((error) => !error.seen),
        hasStartupErrors: ({ startupErrors }) => startupErrors.length > 0,
    },
});
