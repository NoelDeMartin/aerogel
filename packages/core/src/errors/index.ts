import { getErrorMessage } from '@aerogel/core/errors/utils';
import { definePlugin } from '@aerogel/core/plugins';
import { bootServices } from '@aerogel/core/services';
import App from '@aerogel/core/services/App';
import type { App as AppInstance } from 'vue';

import Errors from './Errors';
import type { ErrorReport, ErrorReportLog, ErrorSource } from './Errors.state';
import settings from './settings';

export * from './utils';
export { Errors };
export { default as JobCancelledError } from './JobCancelledError';
export { default as ServiceBootError } from './ServiceBootError';
export { default as InvalidEnvError } from './InvalidEnvError';
export type { ErrorSource, ErrorReport, ErrorReportLog };

const services = { $errors: Errors };
const frameworkHandler: ErrorHandler = (error) => {
    if (getErrorMessage(error).includes('ResizeObserver loop completed with undelivered notifications.')) {
        return true;
    }

    void Errors.report(error);

    return true;
};

function setUpErrorHandler(app: AppInstance, baseHandler: ErrorHandler = () => false): void {
    const errorHandler: ErrorHandler = (error) => baseHandler(error) || frameworkHandler(error);

    app.config.errorHandler = errorHandler;

    globalThis.addEventListener('error', (event) => {
        errorHandler(event.error ?? event);
    });

    globalThis.addEventListener('unhandledrejection', (event) => {
        errorHandler(event.reason);
    });
}

export type ErrorHandler = (error: ErrorSource) => boolean;
export type ErrorsServices = typeof services;

export default definePlugin({
    async install(app, options) {
        // oxlint-disable-next-line typescript/unbound-method
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
