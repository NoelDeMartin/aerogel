import {
    arrayFilter,
    arrayUnique,
    arrayWithout,
    facade,
    fail,
    getLocationQueryParameter,
    hasLocationQueryParameter,
    objectWithout,
    parseBoolean,
    tap,
    urlRoot,
} from '@noeldemartin/utils';
import { fetchLoginUserProfile } from '@noeldemartin/solid-utils';
import { App, Errors, Events, translate } from '@aerogel/core';
import { SolidACLAuthorization, SolidTypeIndex } from 'soukai-solid';
import type { SolidUserProfile } from '@noeldemartin/solid-utils';

import AuthenticationCancelledError from '@/auth/errors/AuthenticationCancelledError';
import { getAuthenticator } from '@/auth';
import type { AuthenticatorName } from '@/auth';
import type Authenticator from '@/auth/Authenticator';
import type { AuthSession } from '@/auth/Authenticator';

import Service from './Solid.state';

export class SolidService extends Service {

    public isLoggedIn(): this is { session: AuthSession; user: SolidUserProfile; authenticator: Authenticator } {
        return this.loggedIn;
    }

    public requireAuthenticator(): Authenticator {
        return this.authenticator ?? fail('Could not get authenticator');
    }

    public requireUser(): SolidUserProfile {
        return this.user ?? fail('Could not get user profile');
    }

    public requireUserProfile(url: string): Promise<SolidUserProfile> {
        return this.getUserProfile(url, true);
    }

    public async getUserProfile(url: string, required: true): Promise<SolidUserProfile>;
    public async getUserProfile(url: string, required?: false): Promise<SolidUserProfile | null>;
    public async getUserProfile(url: string, required: boolean = false): Promise<SolidUserProfile | null> {
        return (
            this.profiles[url] ??
            tap(
                await fetchLoginUserProfile(url, {
                    fetch: this.fetch,
                    required,
                }),
                (profile) => profile && this.rememberProfile(profile),
            )
        );
    }

    public async refreshUserProfile(): Promise<void> {
        if (!this.isLoggedIn()) {
            return;
        }

        this.setState({ profiles: objectWithout(this.profiles, [this.user.webId]) });

        const user = await this.requireUserProfile(this.user.webId);

        this.setState({
            session: {
                ...this.session,
                user,
            },
        });
    }

    public async login(loginUrl: string, authenticatorName?: AuthenticatorName): Promise<boolean> {
        authenticatorName = authenticatorName ?? this.preferredAuthenticator ?? 'default';

        if (this.loggedIn) {
            return true;
        }

        if (this.ongoing) {
            throw new Error('Authentication already in progress');
        }

        const staleTimeout = setTimeout(() => (this.stale = true), 10000);
        this.ongoing = true;

        try {
            const profile = await this.getUserProfile(loginUrl);
            const oidcIssuerUrl = profile?.oidcIssuerUrl ?? urlRoot(profile?.webId ?? loginUrl);
            const authenticator = await this.bootAuthenticator(authenticatorName);

            this.setState({
                dismissed: false,
                ignorePreviousSessionError: true,
                previousSession: {
                    loginUrl,
                    avatarUrl: profile?.avatarUrl,
                    authenticator: authenticatorName,
                    error: translate('auth.stuckConnecting'),
                },
            });

            await authenticator.login(oidcIssuerUrl);

            return true;
        } catch (error) {
            if (error instanceof AuthenticationCancelledError) {
                return false;
            }

            App.isMounted ? Errors.report(error) : this.setState({ loginError: error });

            return false;
        } finally {
            clearTimeout(staleTimeout);

            this.ongoing = false;
            this.stale = false;
        }
    }

    public async reconnect(force: boolean = false): Promise<void> {
        if (this.loggedIn || !this.previousSession || (this.previousSession.error !== null && !force)) {
            return;
        }

        await this.login(this.previousSession.loginUrl, this.previousSession.authenticator);
    }

    public dismiss(): void {
        this.setState({ dismissed: true });
    }

    public async createPrivateTypeIndex(): Promise<string> {
        if (!this.isLoggedIn()) {
            throw new Error('Can\'t create a type index because the user is not logged in');
        }

        const user = this.user;
        const typeIndex = await SolidTypeIndex.withEngine(this.authenticator.engine, () =>
            SolidTypeIndex.createPrivate(user));

        return tap(typeIndex.url, () => {
            user.privateTypeIndexUrl = typeIndex.url;

            this.rememberProfile(user);
        });
    }

    public async createPublicTypeIndex(): Promise<string> {
        if (!this.isLoggedIn()) {
            throw new Error('Can\'t create a type index because the user is not logged in');
        }

        const user = this.user;
        const typeIndex = await SolidTypeIndex.withEngine(this.authenticator.engine, () =>
            SolidTypeIndex.createPublic(user));

        return tap(typeIndex.url, () => {
            user.publicTypeIndexUrl = typeIndex.url;

            this.rememberProfile(user);
        });
    }

    protected async boot(): Promise<void> {
        await super.boot();
        await Errors.booted;

        if (hasLocationQueryParameter('authenticator')) {
            this.setState({
                preferredAuthenticator: getLocationQueryParameter('authenticator') as AuthenticatorName,
            });
        }

        if (hasLocationQueryParameter('refreshProfile')) {
            this.setState({
                staleProfiles: arrayUnique(
                    this.staleProfiles.concat(arrayFilter([this.session?.user.webId, this.previousSession?.loginUrl])),
                ),
            });
        }

        await this.restorePreviousSession();
        await this.startupReconnect();
    }

    private async restorePreviousSession(): Promise<void> {
        if (!this.previousSession) {
            return;
        }

        await this.bootAuthenticator(this.previousSession.authenticator);
    }

    private async startupReconnect(): Promise<void> {
        if (!this.reconnectOnStartup()) {
            return;
        }

        await this.reconnect();
    }

    private reconnectOnStartup(): boolean {
        if (hasLocationQueryParameter('autoReconnect')) {
            return parseBoolean(getLocationQueryParameter('autoReconnect'));
        }

        return this.autoReconnect;
    }

    private async bootAuthenticator(name: AuthenticatorName): Promise<Authenticator> {
        const authenticator = getAuthenticator(name);

        authenticator.addListener({
            onSessionStarted: async (session) => {
                this.setState({
                    session,
                    previousSession: {
                        authenticator: authenticator.name,
                        loginUrl: session.loginUrl,
                        avatarUrl: session.user.avatarUrl,
                        error: null,
                    },
                });

                if (
                    session.user.cloaked ||
                    !session.user.writableProfileUrl ||
                    this.staleProfiles.includes(session.user.webId)
                ) {
                    await this.refreshUserProfile();
                }

                SolidACLAuthorization.setEngine(session.authenticator.engine);

                await Events.emit('login', session);
            },
            onSessionFailed: async (loginUrl, error) => {
                this.setState({
                    previousSession: {
                        authenticator: authenticator.name,
                        loginUrl,
                        error,
                    },
                });
            },
            onSessionEnded: () => this.setState({ session: null }),
            onAuthenticatedFetchReady: (fetch) => Events.emit('authenticated-fetch-ready', fetch),
        });

        await authenticator.boot();

        return authenticator;
    }

    private rememberProfile(profile: SolidUserProfile): void {
        this.setState({
            profiles: {
                ...this.profiles,
                [profile.webId]: profile,
            },
            staleProfiles: arrayWithout(this.staleProfiles, profile.webId),
        });
    }

}

export default facade(new SolidService());
