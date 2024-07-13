import { Storage, after, fail } from '@noeldemartin/utils';
import type { Fetch } from 'soukai-solid';
import type {
    ILoginInputOptions,
    events,
    handleIncomingRedirect,
    login,
    logout,
} from '@inrupt/solid-client-authn-browser';

import Authenticator from '@/auth/Authenticator';
import AuthenticationFailedError from '@/errors/AuthenticationFailedError';
import type { AuthSession } from '@/auth/Authenticator';

import AerogelSolid from 'virtual:aerogel-solid';

const STORAGE_KEY = 'inrupt-authenticator';

export default class InruptAuthenticator extends Authenticator {

    private _events!: typeof events;
    private _fetch!: Fetch;
    private _login!: typeof login;
    private _logout!: typeof logout;
    private _handleIncomingRedirect!: typeof handleIncomingRedirect;

    public async login(loginUrl: string): Promise<AuthSession> {
        Storage.set<string>(STORAGE_KEY, loginUrl);

        const options: ILoginInputOptions = {
            oidcIssuer: loginUrl,
        };

        if (AerogelSolid.clientID) {
            options.clientId = AerogelSolid.clientID.client_id;
            options.clientName = AerogelSolid.clientID.client_name;
            options.redirectUrl = AerogelSolid.clientID.redirect_uris[0];
        }

        await this._login(options);

        // Browser should redirect, so just make it wait for a while.
        await after({ seconds: 60 });

        return fail('Browser should have redirected, but it didn\'t');
    }

    public async logout(): Promise<void> {
        await this._logout();
        await this.endSession();
    }

    protected async restoreSession(): Promise<void> {
        const { events, fetch, handleIncomingRedirect, login, logout } = await import('./InruptAuthenticator.lazy');

        this._fetch = fetch;
        this._login = login;
        this._logout = logout;
        this._events = events;
        this._handleIncomingRedirect = handleIncomingRedirect;

        await this.loginFromRedirect();
    }

    protected async loginFromRedirect(): Promise<void> {
        const loginUrl = Storage.get<string>(STORAGE_KEY);
        if (!loginUrl) {
            return;
        }

        this._events().on('error', (error: string | null, errorDescription?: string | null) => {
            error ??= 'Error using Inrupt Authenticator method';

            this.failSession(loginUrl, new AuthenticationFailedError(error, errorDescription));
        });

        const session = await this._handleIncomingRedirect(window.location.href);

        Storage.remove(STORAGE_KEY);

        if (session?.isLoggedIn && session.webId) {
            await this.initSession(session.webId);
        }
    }

    protected async initSession(webId: string): Promise<void> {
        await this.initAuthenticatedFetch(this._fetch);

        try {
            const { default: Solid } = await import('@/services/Solid');
            const user = await Solid.requireUserProfile(webId);

            await this.startSession({ user, loginUrl: webId });
        } catch (error) {
            await this.failSession(webId, error);
        }
    }

}
