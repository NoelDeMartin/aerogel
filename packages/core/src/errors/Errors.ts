import { JSError, facade, isObject } from '@noeldemartin/utils';

import App from '@/services/App';
import ServiceBootError from '@/errors/ServiceBootError';
import { translate } from '@/lang/utils';

import Service from './Errors.state';
import type { ErrorReport, ErrorReportLog, ErrorSource } from './Errors.state';

export class ErrorsService extends Service {

    public forceReporting: boolean = false;
    private enabled: boolean = true;

    public enable(): void {
        this.enabled = true;
    }

    public disable(): void {
        this.enabled = false;
    }

    public async inspect(error: ErrorSource | ErrorReport[]): Promise<void> {
        const reports = Array.isArray(error) ? error : [await this.createErrorReport(error)];

        // TODO open errors modal
        reports;
    }

    public async report(error: ErrorSource, message?: string): Promise<void> {
        if (App.isDevelopment || App.isTesting) {
            this.logError(error);
        }

        if (!this.enabled) {
            throw error;
        }

        if (!App.isMounted) {
            const startupError = await this.createStartupErrorReport(error);

            if (startupError) {
                this.setState({ startupErrors: this.startupErrors.concat(startupError) });
            }

            return;
        }

        const report = await this.createErrorReport(error);
        const log: ErrorReportLog = {
            report,
            seen: false,
            date: new Date(),
        };

        // TODO open error snackbar
        message;

        this.setState({ logs: [log].concat(this.logs) });
    }

    public see(report: ErrorReport): void {
        this.setState({
            logs: this.logs.map((log) => {
                if (log.report !== report) {
                    return log;
                }

                return {
                    ...log,
                    seen: true,
                };
            }),
        });
    }

    public seeAll(): void {
        this.setState({
            logs: this.logs.map((log) => ({
                ...log,
                seen: true,
            })),
        });
    }

    private logError(error: unknown): void {
        // eslint-disable-next-line no-console
        console.error(error);

        if (isObject(error) && error.cause) {
            this.logError(error.cause);
        }
    }

    private async createErrorReport(error: ErrorSource): Promise<ErrorReport> {
        if (typeof error === 'string') {
            return { title: error };
        }

        if (error instanceof Error || error instanceof JSError) {
            return this.createErrorReportFromError(error);
        }

        return {
            title: translate('errors.unknown'),
            error,
        };
    }

    private async createStartupErrorReport(error: ErrorSource): Promise<ErrorReport | null> {
        if (error instanceof ServiceBootError) {
            // Ignore second-order boot errors in order to have a cleaner startup crash screen.
            return error.cause instanceof ServiceBootError ? null : this.createErrorReport(error.cause);
        }

        return this.createErrorReport(error);
    }

    private createErrorReportFromError(error: Error | JSError, defaults: Partial<ErrorReport> = {}): ErrorReport {
        return {
            title: error.name,
            description: error.message,
            details: error.stack,
            error,
            ...defaults,
        };
    }

}

export default facade(new ErrorsService());
