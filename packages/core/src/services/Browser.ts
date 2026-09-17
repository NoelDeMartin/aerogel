import { facade } from '@noeldemartin/utils';

import Errors from '@aerogel/core/errors/Errors';

import Service from './Browser.state';

function getBrowserName(): 'chrome' | 'edge' | 'other' {
    const userAgent = navigator.userAgent;

    if (userAgent.includes('Edg/')) {
        return 'edge';
    }

    if (userAgent.includes('Chrome/')) {
        return 'chrome';
    }

    return 'other';
}

export class BrowserService extends Service {

    public readonly name: 'chrome' | 'edge' | 'other' = getBrowserName();
    private wakeLock: Promise<void | { release(): Promise<void> }> | null = null;
    private wakeLockRequested: 'screen' | null = null;

    public acquireScreenLock(): void {
        this.wakeLockRequested = 'screen';

        this.acquireWakeLock();
    }

    public releaseScreenLock(): void {
        this.wakeLockRequested = null;

        this.releaseWakeLock();
    }

    protected override async boot(): Promise<void> {
        await this.watchWakeLock();
    }

    private async watchWakeLock(): Promise<void> {
        document.addEventListener('visibilitychange', () => {
            if (!this.wakeLockRequested) {
                return;
            }

            switch (document.visibilityState) {
                case 'hidden':
                    this.releaseWakeLock();

                    break;
                case 'visible':
                    this.acquireWakeLock();

                    break;
            }
        });
    }

    private acquireWakeLock(): void {
        if (
            this.wakeLock ||
            !this.wakeLockRequested ||
            !this.supportsWakeLocking ||
            document.visibilityState === 'hidden'
        ) {
            return;
        }

        try {
            this.wakeLock = navigator.wakeLock.request(this.wakeLockRequested).catch((error) => {
                Errors.reportDevelopmentError(error, 'Could not acquire wake lock');
            });
        } catch (error) {
            Errors.reportDevelopmentError(error, 'Could not acquire wake lock');
        }
    }

    private releaseWakeLock(): void {
        if (!this.wakeLock) {
            return;
        }

        this.wakeLock.then((lock) => lock?.release());
        this.wakeLock = null;
    }

}

export default facade(BrowserService);
