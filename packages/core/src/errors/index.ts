import type { App } from 'vue';

import { bootServices } from '@/services';
import { definePlugin } from '@/plugins';

import Errors from './Errors';
import { ErrorReport, ErrorReportLog, ErrorSource } from './Errors.state';

export { Errors, ErrorSource, ErrorReport, ErrorReportLog };

const services = { $errors: Errors };
const frameworkHandler: ErrorHandler = (error) => {
    if (!Errors.instance) {
        // eslint-disable-next-line no-console
        console.warn('Errors service hasn\'t been initialized properly!');

        // eslint-disable-next-line no-console
        console.error(error);

        return true;
    }

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
    interface AerogelOptions {
        handleError?(error: ErrorSource): boolean;
    }
}

declare module '@/services' {
    export interface Services extends ErrorsServices {}
}
