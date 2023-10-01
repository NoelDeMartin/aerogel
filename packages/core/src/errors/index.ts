import { bootServices } from '@/services';
import { definePlugin } from '@/plugins';

import Errors from './Errors';
import { ErrorReport, ErrorReportLog, ErrorSource } from './Errors.state';

export { Errors, ErrorSource, ErrorReport, ErrorReportLog };

const services = { $errors: Errors };

export type ErrorsServices = typeof services;

export default definePlugin({
    async install(app) {
        await bootServices(app, services);
    },
});

declare module '@/services' {
    export interface Services extends ErrorsServices {}
}
