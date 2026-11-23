import { isDevelopment } from '@noeldemartin/utils';

export function reportDevelopmentError(error: unknown, message: string): void {
    if (!isDevelopment()) {
        return;
    }

    // oxlint-disable-next-line no-console
    console.warn(message, error);
}
