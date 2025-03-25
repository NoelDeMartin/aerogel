import { after, required } from '@noeldemartin/utils';
import { persistent } from '@aerogel/core';
import type { SolidUserProfile } from '@noeldemartin/solid-utils';
import type { UnwrapNestedRefs } from 'vue';

import Authenticator from '@aerogel/plugin-solid/auth/Authenticator';
import AuthenticationFailedError from '@aerogel/plugin-solid/errors/AuthenticationFailedError';
import Solid from '@aerogel/plugin-solid/services/Solid';
import type { AuthSession } from '@aerogel/plugin-solid/auth/Authenticator';

interface Data {
    webId?: string;
    loginUrl?: string;
}

export default class LegacyAuthenticator extends Authenticator {

    private store: UnwrapNestedRefs<Data>;

    constructor() {
        super();

        this.store = persistent('legacy-authenticator', {});
    }

    public async login(loginUrl: string, user?: SolidUserProfile | null): Promise<AuthSession> {
        const { SolidAuthClient } = await import('./LegacyAuthenticator.lazy');

        this.store.webId = user?.webId;
        this.store.loginUrl = user?.oidcIssuerUrl ?? loginUrl;

        const result = await SolidAuthClient.login(this.store.loginUrl);

        if (result === null) {
            delete this.store.webId;
            delete this.store.loginUrl;

            throw new AuthenticationFailedError('Could not log in with Solid using the legacy authenticator');
        }

        // Browser should redirect, so just make it wait for a while.
        await after({ seconds: 60 });

        throw new Error('Browser should have redirected, but it didn\'t');
    }

    public async logout(): Promise<void> {
        const { SolidAuthClient } = await import('./LegacyAuthenticator.lazy');

        delete this.store.webId;
        delete this.store.loginUrl;

        await SolidAuthClient.logout();
        await this.endSession();
    }

    protected async restoreSession(): Promise<void> {
        if (!this.store.loginUrl) {
            return;
        }

        const { SolidAuthClient } = await import('./LegacyAuthenticator.lazy');

        const session = await SolidAuthClient.currentSession();
        const loginUrl = required(this.store.loginUrl);

        await this.initAuthenticatedFetch((input: RequestInfo, options?: Object) => {
            return SolidAuthClient.fetch(input, options);
        });

        try {
            const user = await Solid.requireUserProfile(required(session?.webId ?? this.store.webId));

            await this.startSession({ user, loginUrl });
        } catch (error) {
            await this.failSession(loginUrl, error);
        }
    }

}
