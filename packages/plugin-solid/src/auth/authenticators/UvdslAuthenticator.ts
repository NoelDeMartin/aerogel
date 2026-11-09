import Authenticator from '@aerogel/plugin-solid/auth/Authenticator';
import type { AuthenticatorBootOptions, AuthSession } from '@aerogel/plugin-solid/auth/Authenticator';
import AuthenticationFailedError from '@aerogel/plugin-solid/errors/AuthenticationFailedError';
import Solid from '@aerogel/plugin-solid/services/Solid';
import { after, fail, required } from '@noeldemartin/utils';
import AerogelSolid from 'virtual:aerogel-solid';

import type UvdslSession from './UvdslAuthenticator.lazy';

export default class UvdslAuthenticator extends Authenticator {
    private session?: UvdslSession;

    public async login(loginUrl: string): Promise<AuthSession> {
        const redirectUrl = AerogelSolid.clientID?.redirect_uris[0] ?? globalThis.location.href;

        await this.requireSession().login(loginUrl, redirectUrl);

        // Browser should redirect, so just make it wait for a while.
        await after({ seconds: 60 });

        return fail("Browser should have redirected, but it didn't");
    }

    public async logout(): Promise<void> {
        await this.requireSession().logout();
    }

    protected async restoreSession(options: AuthenticatorBootOptions): Promise<void> {
        const { default: Session } = await import('./UvdslAuthenticator.lazy');
        const session = (this.session = new Session({
            onSessionStateChange: () => session.isActive || this.endSession(),
        }));

        if (!Solid.wasLoggedIn()) {
            return;
        }

        try {
            await session.handleRedirectFromLogin();
        } catch (error) {
            await this.failSession(
                required(Solid.previousSession).loginUrl,
                new AuthenticationFailedError('Could not complete authentication', null, { cause: error }),
            );

            return;
        }

        if (!session.isActive && options.reconnect) {
            await session.restore().catch(() => null);
        }

        if (!session.webId) {
            return;
        }

        await this.initAuthenticatedFetch((input: RequestInfo, init?: RequestInit) => session.authFetch(input, init));

        try {
            const user = await Solid.requireUserProfile(session.webId, { fetch: this.requireAuthenticatedFetch() });

            await this.startSession({ user, loginUrl: session.webId });
        } catch (error) {
            await this.failSession(session.webId, error);
        }
    }

    private requireSession(): UvdslSession {
        return this.session ?? fail('UvdslAuthenticator has not been booted');
    }
}
