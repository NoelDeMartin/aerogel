import type { App as AppInstance } from 'vue';

import App from '@aerogel/core/services/App';
import { bootServices } from '@aerogel/core/services';
import { definePlugin } from '@aerogel/core/plugins';
import { getErrorMessage } from '@aerogel/core/errors/utils';

import Errors from './Errors';
import settings from './settings';
import type { ErrorReport, ErrorReportLog, ErrorSource } from './Errors.state';

export * from './utils';
export { Errors };
export { default as JobCancelledError } from './JobCancelledError';
export { default as ServiceBootError } from './ServiceBootError';
export type { ErrorSource, ErrorReport, ErrorReportLog };

const services = { $errors: Errors };
const frameworkHandler: ErrorHandler = (error) => {
    if (getErrorMessage(error).includes('ResizeObserver loop completed with undelivered notifications.')) {
        return true;
    }

    Errors.report(error);

    return true;
};

function setUpErrorHandler(app: AppInstance, baseHandler: ErrorHandler = () => false): void {
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

        settings.forEach((setting) => App.addSetting(setting));

        await bootServices(app, services);
    },
});

declare module '@aerogel/core/bootstrap/options' {
    export interface AerogelOptions {
        handleError?(error: ErrorSource): boolean;
    }
}

declare module '@aerogel/core/services' {
    export interface Services extends ErrorsServices {}
}
