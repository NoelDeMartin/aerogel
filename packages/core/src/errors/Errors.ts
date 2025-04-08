import { JSError, facade, isDevelopment, isObject, isTesting, objectWithoutEmpty, toString } from '@noeldemartin/utils';

import App from '@aerogel/core/services/App';
import ServiceBootError from '@aerogel/core/errors/ServiceBootError';
import UI, { UIComponents } from '@aerogel/core/ui/UI';
import { translateWithDefault } from '@aerogel/core/lang/utils';
import { Events } from '@aerogel/core/services';
import type { ErrorReportModalProps } from '@aerogel/core/components/contracts/ErrorReportModal';
import type { ModalComponent } from '@aerogel/core/ui/UI.state';

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
        const reports = Array.isArray(error) ? (error as ErrorReport[]) : [await this.createErrorReport(error)];

        if (reports.length === 0) {
            UI.alert(translateWithDefault('errors.inspectEmpty', 'Nothing to inspect!'));

            return;
        }

        UI.openModal<ModalComponent<ErrorReportModalProps>>(UI.requireComponent(UIComponents.ErrorReportModal), {
            reports,
        });
    }

    public async report(error: ErrorSource, message?: string): Promise<void> {
        await Events.emit('error', { error, message });

        if (isTesting('unit')) {
            throw error;
        }

        if (isDevelopment()) {
            this.logError(error);
        }

        if (!this.enabled) {
            throw error;
        }

        if (!App.isMounted()) {
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

        UI.toast(
            message ??
                translateWithDefault('errors.notice', 'Something went wrong, but it\'s not your fault. Try again!'),
            {
                variant: 'danger',
                actions: [
                    {
                        label: translateWithDefault('errors.viewDetails', 'View details'),
                        dismiss: true,
                        click: () =>
                            UI.openModal<ModalComponent<ErrorReportModalProps>>(
                                UI.requireComponent(UIComponents.ErrorReportModal),
                                { reports: [report] },
                            ),
                    },
                ],
            },
        );

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

        if (isObject(error)) {
            return objectWithoutEmpty({
                title: toString(
                    error['name'] ?? error['title'] ?? translateWithDefault('errors.unknown', 'Unknown Error'),
                ),
                description: toString(
                    error['message'] ??
                        error['description'] ??
                        translateWithDefault('errors.unknownDescription', 'Unknown error object'),
                ),
                error,
            });
        }

        return {
            title: translateWithDefault('errors.unknown', 'Unknown Error'),
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

export default facade(ErrorsService);

declare module '@aerogel/core/services/Events' {
    export interface EventsPayload {
        error: { error: ErrorSource; message?: string };
    }
}
