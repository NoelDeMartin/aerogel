import AerogelSolid from 'virtual:aerogel-solid';

import Authenticator, { type AuthSession } from '@aerogel/plugin-solid/auth/Authenticator';
import Solid from '@aerogel/plugin-solid/services/Solid';
import { PromisedValue, fail } from '@noeldemartin/utils';
import { watch } from 'vue';
import type { Fetch, SolidUserProfile } from '@noeldemartin/solid-utils';
import type { Session } from '@uvdsl/solid-oidc-client-browser';

export default class UVDSLAuthenticator extends Authenticator {

    private session?: Session;

    public override async login(loginUrl: string, user?: SolidUserProfile | null): Promise<AuthSession> {
        this.session ??= await this.createSession();

        await this.session.restore();

        if (!this.session.isActive) {
            // TODO how do I pass more data? App name, etc.
            await this.session.login(
                user?.oidcIssuerUrl ?? `${loginUrl}/`,
                AerogelSolid.clientID?.redirect_uris[0] ?? window.location.href,
            );
        }

        const session = await this.watchSession();

        return session;
    }

    public override async logout(): Promise<void> {
        await this.session?.logout();
    }

    protected override async restoreSession(): Promise<void> {
        this.session ??= await this.createSession();

        // TODO catch errors
        // TODO Caused by: Error: RFC 9207 - iss != idp - http://localhost:3000/ != http://localhost:3000

        // TODO what's the difference between these two?
        await this.session.handleRedirectFromLogin();
        await this.session.restore();

        this.watchSession();
    }

    private async createSession(): Promise<Session> {
        const { Session } = await import('./UVDSLAuthenticator.lazy');

        return (this.session = new Session());
    }

    private async watchSession(): Promise<AuthSession> {
        const promisedSession = new PromisedValue<AuthSession>();

        watch(
            () => this.session?.isActive,
            async () => {
                if (!this.session?.isActive || !this.session.webId) {
                    // TODO close session?
                    return;
                }

                const session = await this.initSession(this.session.webId);

                session && promisedSession.resolve(session);
            },
            { immediate: true },
        );

        return promisedSession;
    }

    private async initSession(webId: string): Promise<AuthSession | null> {
        const authFetch = this.session?.authFetch ?? fail<Fetch>('Authenticated fetch missing from uvsdl session');

        await this.initAuthenticatedFetch(authFetch.bind(this.session));

        try {
            const user = await Solid.requireUserProfile(webId);
            const session = await this.startSession({ user, loginUrl: webId });

            return session;
        } catch (error) {
            await this.failSession(webId, error);
        }

        return null;
    }

}
