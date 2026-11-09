import { appNamespace } from '@aerogel/core';
import { SessionCore } from '@uvdsl/solid-oidc-client-browser/core';
import type { SessionOptions } from '@uvdsl/solid-oidc-client-browser/core';
import { SessionIDB } from '@uvdsl/solid-oidc-client-browser/web';
import AerogelSolid from 'virtual:aerogel-solid';

const EXPIRATION_BUFFER_SECONDS = 30;
const REFRESH_THRESHOLD_RATIO = 0.8;
const REFRESH_RETRY_MS = 60_000;
const REJECTED_REFRESH_ERROR = /HTTP error! Status: 40[01]\b|details missing from database/;

export default class UvdslSession extends SessionCore {
    private restoring?: Promise<void>;
    private refreshAt?: number;
    private refreshFailed = false;
    private refreshTimeout?: ReturnType<typeof setTimeout>;

    constructor(options: Pick<SessionOptions, 'onSessionStateChange'> = {}) {
        super(AerogelSolid.clientID && { client_id: AerogelSolid.clientID.client_id }, {
            ...options,
            database: new SessionIDB(`${appNamespace()}-solid-oidc`),
        });

        document.addEventListener(
            'visibilitychange',
            () => document.visibilityState === 'visible' && this.refreshIfDue(),
        );
        window.addEventListener('online', () => this.refreshFailed && this.refresh());
    }

    public override restore(): Promise<void> {
        if (this.restoring) {
            return this.restoring;
        }

        const restoring = this.restoreWithLock()
            .catch(async (error) => {
                if (this.isActive && REJECTED_REFRESH_ERROR.test(String(error))) {
                    await this.logout();
                }

                throw error;
            })
            .finally(() => (this.restoring = undefined));

        this.restoring = restoring;

        return restoring;
    }

    public override async logout(): Promise<void> {
        this.cancelRefresh();

        await super.logout();
    }

    public override isExpired(): boolean {
        return this.getExpiresIn() < EXPIRATION_BUFFER_SECONDS;
    }

    protected override async setTokenDetails(...args: Parameters<SessionCore['setTokenDetails']>): Promise<void> {
        await super.setTokenDetails(...args);

        if (!this.isActive) {
            return;
        }

        this.scheduleRefresh(this.getExpiresIn() * 1000 * REFRESH_THRESHOLD_RATIO);
    }

    private async restoreWithLock(): Promise<void> {
        if (!globalThis.navigator?.locks) {
            return super.restore();
        }

        await navigator.locks.request(`${appNamespace()}-solid-oidc-refresh`, () => super.restore());
    }

    private scheduleRefresh(delayMs: number, afterFailure: boolean = false): void {
        this.cancelRefresh();

        this.refreshAt = Date.now() + delayMs;
        this.refreshFailed = afterFailure;
        this.refreshTimeout = setTimeout(() => this.refresh(), delayMs);
    }

    private cancelRefresh(): void {
        clearTimeout(this.refreshTimeout);

        this.refreshAt = undefined;
        this.refreshFailed = false;
        this.refreshTimeout = undefined;
    }

    private refreshIfDue(): void {
        if (this.refreshAt === undefined || Date.now() < this.refreshAt) {
            return;
        }

        this.refresh();
    }

    private refresh(): void {
        this.cancelRefresh();
        this.restore().catch(() => this.isActive && this.scheduleRefresh(REFRESH_RETRY_MS, true));
    }
}
