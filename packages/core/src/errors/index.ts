import type { App } from 'vue';

import { bootServices } from '@/services';
import { definePlugin } from '@/plugins';

import Errors from './Errors';
import { ErrorReport, ErrorReportLog, ErrorSource } from './Errors.state';

export * from './utils';
export { Errors, ErrorSource, ErrorReport, ErrorReportLog };
export { default as JobCancelledError } from './JobCancelledError';
export { default as ServiceBootError } from './ServiceBootError';

const services = { $errors: Errors };
const frameworkHandler: ErrorHandler = (error) => {
    Errors.report(error);

    return true;
};

function setUpErrorHandler(app: App, baseHandler: ErrorHandler = () => false): void {
    const errorHandler: ErrorHandler = (error) => baseHandler(error) || frameworkHandler(error);

    app.config.errorHandler = errorHandler;
    globalThis.onerror = (event, _, __, ___, error) => errorHandler(error ?? event);
    globalThis.onunhandledrejection = (event) => errorHandler(event.reason);
}

export type ErrorHandler = (error: ErrorSource) => boolean;
export type ErrorsServices = typeof services;

export default definePlugin({
    async install(app, options) {
        setUpErrorHandler(app, options.handleError);

        await bootServices(app, services);
    },
});

declare module '@/bootstrap/options' {
    export interface AerogelOptions {
        handleError?(error: ErrorSource): boolean;
    }
}

declare module '@/services' {
    export interface Services extends ErrorsServices {}
}
