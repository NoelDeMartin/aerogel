import {
    after,
    arrayFilter,
    arrayUnique,
    arrayWithout,
    asyncMemo,
    facade,
    fail,
    getLocationQueryParameter,
    hasLocationQueryParameter,
    isDevelopment,
    objectWithout,
    objectWithoutEmpty,
    parseBoolean,
    requireUrlParse,
    resetAsyncMemo,
    setAsyncMemo,
    tap,
    urlRoot,
} from '@noeldemartin/utils';
import { App, Errors, Events, Storage, UI, translateWithDefault } from '@aerogel/core';
import { fetchLoginUserProfile } from '@noeldemartin/solid-utils';
import { getBootedModels, setEngine } from 'soukai';
import { SolidContainer, SolidTypeIndex, coreModels, isSolidModel } from 'soukai-solid';
import type { ErrorSource } from '@aerogel/core';
import type { Fetch, SolidModelConstructor } from 'soukai-solid';
import type { NullablePartial } from '@noeldemartin/utils';
import type { SolidStore, SolidUserProfile } from '@noeldemartin/solid-utils';

import AuthenticationCancelledError from '@aerogel/plugin-solid/errors/AuthenticationCancelledError';
import { ContainerAlreadyInUse } from '@aerogel/plugin-solid/errors';
import { getAuthenticator } from '@aerogel/plugin-solid/auth';
import { isTrackingModel, trackModelsCollection } from '@aerogel/plugin-soukai';
import type Authenticator from '@aerogel/plugin-solid/auth/Authenticator';
import type { AuthenticatorName } from '@aerogel/plugin-solid/auth';
import type { AuthSession } from '@aerogel/plugin-solid/auth/Authenticator';

import Service, { DEFAULT_STATE } from './Solid.state';

export type LoginOptions = NullablePartial<{
    authenticator: AuthenticatorName;
    onError(error: ErrorSource): unknown;
    fallbackUrl: string;
    loading: boolean;
}>;

export type UserProfileOptions = NullablePartial<{
    required: boolean;
    markStale: boolean;
}>;

export type ReconnectOptions = Omit<LoginOptions, 'authenticator'> & {
    force?: boolean;
};

export class SolidService extends Service {

    public isLoggedIn(): this is { session: AuthSession; user: SolidUserProfile; authenticator: Authenticator } {
        return !!this.session;
    }

    public wasLoggedIn(): this is { user: SolidUserProfile } {
        return !!this.previousSession;
    }

    public hasLoggedIn(): this is { user: SolidUserProfile } {
        return !!(this.session || this.previousSession);
    }

    public requireAuthenticator(): Authenticator {
        return this.authenticator ?? fail('Could not get authenticator');
    }

    public requireUser(): SolidUserProfile {
        return this.user ?? fail('Could not get user profile (are you logged in?)');
    }

    public requireUserProfile(url: string): Promise<SolidUserProfile> {
        return this.getUserProfile(url, { required: true });
    }

    /* eslint-disable max-len */
    public async getUserProfile(url: string, options: Omit<UserProfileOptions, 'required'> & { required: true }): Promise<SolidUserProfile>; // prettier-ignore
    public async getUserProfile(url: string, options?: UserProfileOptions): Promise<SolidUserProfile | null>;
    /* eslint-enable max-len */

    public async getUserProfile(url: string, options: UserProfileOptions = {}): Promise<SolidUserProfile | null> {
        let profileStore: SolidStore | null = null;
        const markStale = options.markStale ?? !this.authenticator?.getAuthenticatedFetch();
        const userProfile =
            this.profiles[url] ??
            (await tap(
                await fetchLoginUserProfile(url, {
                    fetch: this.fetch,
                    required: options.required ?? false,
                    onLoaded(store) {
                        profileStore = store;
                    },
                }),
                async (profile) => {
                    if (!profile) {
                        return;
                    }

                    if (profileStore) {
                        await Events.emit('solid:user-profile-loaded', [profile, profileStore]);
                    }

                    this.rememberProfile(profile);
                },
            ));

        if (userProfile && markStale) {
            this.setState({ staleProfiles: arrayUnique(this.staleProfiles.concat([userProfile.webId])) });
        }

        return userProfile;
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

    public async login(loginUrl: string, options: LoginOptions = {}): Promise<boolean> {
        if (isDevelopment() && loginUrl === 'dev') {
            loginUrl = 'http://localhost:3000';
        }

        if (!/^https?:\/\//.test(loginUrl)) {
            options.fallbackUrl ??= `http://${loginUrl}`;
            loginUrl = `https://${loginUrl}`;
        }

        if (this.isLoggedIn()) {
            return true;
        }

        if (this.loginOngoing) {
            throw new Error('Authentication already in progress');
        }

        if (!options.loading) {
            return this.attemptLogin(loginUrl, options);
        }

        return UI.loading(translateWithDefault('solid.loginOngoing', 'Logging in...'), () => {
            return this.attemptLogin(loginUrl, options);
        });
    }

    public async reconnect(options: ReconnectOptions = {}): Promise<void> {
        const { force, ...loginOptions } = options;
        if (this.isLoggedIn() || !this.previousSession || (this.previousSession.error !== null && !force)) {
            return;
        }

        await this.login(this.previousSession.loginUrl, {
            authenticator: this.previousSession.authenticator,
            ...loginOptions,
            loading: loginOptions.loading ?? false,
        });
    }

    public async logout(force: boolean = false): Promise<void> {
        const isCloudReady = !App.plugin('@aerogel/local-first') || !!App.service('$cloud')?.ready;
        const hasLocalChanges = !App.plugin('@aerogel/local-first') || !!App.service('$cloud')?.dirty;
        const [confirmLogout, options] = force
            ? [true, { wipeLocalData: isCloudReady }]
            : await UI.confirm(
                isCloudReady
                    ? translateWithDefault('solid.logoutConfirmTitle', 'Log out from this device?')
                    : translateWithDefault('solid.disconnectConfirmTitle', 'Disconnect account?'),
                isCloudReady
                    ? hasLocalChanges
                        ? translateWithDefault(
                            'solid.logoutConfirmMessageWithLocalChanges',
                            'There are some changes that haven\'t been synchronized and will be lost, ' +
                                    'but the rest of the data will remain in your Solid POD.',
                        )
                        : translateWithDefault(
                            'solid.logoutConfirmMessage',
                            'Logging out will remove all the data from this device, ' +
                                    'but you\'ll still have it in your Solid POD.',
                        )
                    : translateWithDefault(
                        'solid.disconnectConfirmMessage',
                        'You\'ll need to introduce your credentials again to connect to your Solid POD.',
                    ),
                {
                    acceptText: translateWithDefault('solid.logoutConfirmAccept', 'Log out'),
                    acceptVariant: 'danger',
                    cancelText: translateWithDefault(
                        'solid.logoutConfirmCancel',
                        translateWithDefault('ui.cancel', 'Cancel'),
                    ),
                    checkboxes: isCloudReady
                        ? hasLocalChanges
                            ? {
                                wipeLocalData: {
                                    label: translateWithDefault(
                                        'solid.logoutConfirmWipeNotice',
                                        'I understand that changes that haven\'t been synchronized will be lost.',
                                    ),
                                    default: false,
                                    required: true,
                                },
                            }
                            : undefined
                        : {
                            wipeLocalData: {
                                label: translateWithDefault(
                                    'solid.logoutConfirmWipe',
                                    'Also remove all existing data',
                                ),
                                default: false,
                            },
                        },
                },
            );

        if (!confirmLogout) {
            return;
        }

        if (!this.previousSession) {
            return;
        }

        await UI.loading(translateWithDefault('solid.logoutOngoing', 'Logging out...'), async () => {
            this.setState({
                dismissed: false,
                ignorePreviousSessionError: false,
                loginStartupError: null,
                previousSession: null,
                ...DEFAULT_STATE,
            });

            this.isLoggedIn() && (await this.authenticator.logout());

            if (options.wipeLocalData ?? true) {
                await Storage.purge();
            }

            await Events.emit('auth:logout');
            await Events.emit('auth:after-logout');
        });
    }

    public async whenLoggedIn<T>(callback: (session: AuthSession) => T): Promise<T> {
        if (this.isLoggedIn()) {
            return callback(this.session);
        }

        return new Promise((resolve) => {
            const onLogin = (session: AuthSession) => resolve(callback(session));

            Events.once('auth:login', onLogin);
        });
    }

    public dismiss(): void {
        this.setState({ dismissed: true });
    }

    public async findOrCreatePrivateTypeIndex(): Promise<SolidTypeIndex> {
        return (await this.findPrivateTypeIndex()) ?? (await this.createPrivateTypeIndex());
    }

    public async findPrivateTypeIndex(options: { fresh?: boolean } = {}): Promise<SolidTypeIndex | null> {
        const { webId, privateTypeIndexUrl } = this.requireUser();
        const engine = this.requireAuthenticator().engine;

        if (!privateTypeIndexUrl) {
            return null;
        }

        if (options.fresh) {
            resetAsyncMemo(`${webId}-privateTypeIndex`);
        }

        return asyncMemo(`${webId}-privateTypeIndex`, () =>
            SolidTypeIndex.withEngine(engine).find(privateTypeIndexUrl));
    }

    public async findOrCreatePublicTypeIndex(): Promise<SolidTypeIndex> {
        return (await this.findPublicTypeIndex()) ?? (await this.createPublicTypeIndex());
    }

    public async findPublicTypeIndex(options: { fresh?: boolean } = {}): Promise<SolidTypeIndex | null> {
        const { webId, publicTypeIndexUrl } = this.requireUser();
        const engine = this.requireAuthenticator().engine;

        if (!publicTypeIndexUrl) {
            return null;
        }

        if (options.fresh) {
            resetAsyncMemo(`${webId}-publicTypeIndex`);
        }

        return asyncMemo(`${webId}-publicTypeIndex`, () => SolidTypeIndex.withEngine(engine).find(publicTypeIndexUrl));
    }

    public async createPrivateContainer(options: {
        url: string;
        name?: string;
        registerFor?: SolidModelConstructor;
        reuseExisting?: boolean;
    }): Promise<SolidContainer> {
        const engine = this.requireAuthenticator().engine;

        return SolidContainer.withEngine(engine, async () => {
            const existingContainer = await SolidContainer.find(options.url);

            if (existingContainer && !options.reuseExisting) {
                throw new ContainerAlreadyInUse(existingContainer);
            }

            const container = existingContainer ?? new SolidContainer({ url: options.url, name: options.name });

            await container.save();

            if (options.registerFor) {
                const typeIndex = await this.findOrCreatePrivateTypeIndex();

                await container.register(typeIndex, options.registerFor);
            }

            return container;
        });
    }

    protected override async boot(): Promise<void> {
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
        await this.trackSolidModels();
    }

    protected async createPrivateTypeIndex(): Promise<SolidTypeIndex> {
        const user = this.requireUser();
        const authenticator = this.requireAuthenticator();
        const typeIndex = await SolidTypeIndex.withEngine(authenticator.engine).createPrivate(user);

        return tap(typeIndex, () => {
            user.privateTypeIndexUrl = typeIndex.url;

            setAsyncMemo(`${user.webId}-privateTypeIndex`, typeIndex);

            this.rememberProfile(user);
        });
    }

    public async createPublicTypeIndex(): Promise<SolidTypeIndex> {
        const user = this.requireUser();
        const authenticator = this.requireAuthenticator();
        const typeIndex = await SolidTypeIndex.withEngine(authenticator.engine).createPublic(user);

        return tap(typeIndex, () => {
            user.privateTypeIndexUrl = typeIndex.url;

            setAsyncMemo(`${user.webId}-publicTypeIndex`, typeIndex);

            this.rememberProfile(user);
        });
    }

    protected async attemptLogin(loginUrl: string, options: LoginOptions): Promise<boolean> {
        const authenticatorName = options.authenticator ?? this.preferredAuthenticator ?? 'default';
        const handleLoginError =
            options.onError ??
            ((error: ErrorSource) =>
                App.isMounted() ? Errors.report(error) : this.setState({ loginStartupError: error }));
        const staleTimeout = setTimeout(() => (this.loginStale = true), 10000);
        const initialState = {
            dismissed: this.dismissed,
            ignorePreviousSessionError: this.ignorePreviousSessionError,
            previousSession: this.previousSession,
        };

        this.loginOngoing = true;

        try {
            const profile = await this.getUserProfile(loginUrl, { markStale: true });
            const oidcIssuerUrl = profile?.oidcIssuerUrl ?? urlRoot(profile?.webId ?? loginUrl);
            const authenticator = await this.bootAuthenticator(authenticatorName);
            const { domain: loginDomain } = requireUrlParse(loginUrl);

            this.setState({
                dismissed: false,
                ignorePreviousSessionError: true,
                previousSession: objectWithoutEmpty({
                    profile,
                    loginUrl,
                    authenticator: authenticatorName,
                    error: translateWithDefault(
                        'solid.stuckConnecting',
                        'We didn\'t hear back from the identity provider at `{domain}`, maybe try reconnecting?',
                        { domain: loginDomain },
                    ),
                }),
            });

            await Events.emit('auth:before-login');

            // This should redirect away from the app, so in most cases
            // the rest of the code won't be reached.
            await authenticator.login(oidcIssuerUrl, profile);

            return true;
        } catch (error) {
            this.setState(initialState);

            if (error instanceof AuthenticationCancelledError) {
                return false;
            }

            if (options.fallbackUrl) {
                return after().then(() => this.login(options.fallbackUrl ?? '', objectWithout(options, 'fallbackUrl')));
            }

            handleLoginError(error);

            return false;
        } finally {
            clearTimeout(staleTimeout);

            this.setState({
                loginOngoing: false,
                loginStale: false,
            });
        }
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

        await this.reconnect({ force: this.forcingReconnect() });
    }

    private reconnectOnStartup(): boolean {
        if (hasLocationQueryParameter('autoReconnect')) {
            return parseBoolean(getLocationQueryParameter('autoReconnect'));
        }

        return this.autoReconnect;
    }

    private forcingReconnect(): boolean {
        return hasLocationQueryParameter('autoReconnect') && parseBoolean(getLocationQueryParameter('autoReconnect'));
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
                        profile: session.user,
                        error: null,
                    },
                });

                if (this.staleProfiles.includes(session.user.webId)) {
                    await this.refreshUserProfile();
                }

                App.plugin('@aerogel/local-first') || setEngine(session.authenticator.engine);

                coreModels.forEach((model) => model.setEngine(session.authenticator.engine));

                await Events.emit('auth:login', session);
            },
            onSessionFailed: async (loginUrl, error) => {
                this.setState({
                    session: null,
                    previousSession: {
                        profile: this.previousSession?.profile,
                        authenticator: authenticator.name,
                        loginUrl,
                        error,
                    },
                });
            },
            onSessionEnded: () => this.setState({ session: null }),
            onAuthenticatedFetchReady: (fetch) => Events.emit('auth:fetch-ready', fetch),
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

    private async trackSolidModels(): Promise<void> {
        Events.on('purge-storage', () => (this.collections = {}));
        Events.on('soukai:track-models', async (modelClass) => {
            if (!isSolidModel(modelClass)) {
                return;
            }

            modelClass.on('created', async (model) => {
                const containerUrl = model.getContainerUrl();

                if (
                    !containerUrl ||
                    model.getDefaultCollection() === containerUrl ||
                    this.collections[model.static().modelName]?.includes(containerUrl)
                ) {
                    return;
                }

                const modelCollections = this.collections[model.static().modelName] ?? [];

                modelCollections.push(containerUrl);

                this.collections = {
                    ...this.collections,
                    [model.static().modelName]: modelCollections,
                };

                await trackModelsCollection(modelClass, containerUrl, { refresh: false });
            });

            await Promise.all(
                this.collections[modelClass.modelName]?.map(
                    (containerUrl) => trackModelsCollection(modelClass, containerUrl),
                    { refresh: false },
                ) ?? [],
            );
        });

        for (const [modelName, containerUrls] of Object.entries(this.collections)) {
            const modelClass = getBootedModels().get(modelName);

            if (!modelClass || !isTrackingModel(modelClass)) {
                continue;
            }

            for (const containerUrl of containerUrls) {
                await trackModelsCollection(modelClass, containerUrl);
            }
        }
    }

}

export default facade(SolidService);

declare module '@aerogel/core' {
    export interface EventsPayload {
        'auth:fetch-ready': Fetch;
        'auth:before-login': void;
        'auth:login': AuthSession;
        'auth:logout': void;
        'auth:after-logout': void;
        'solid:user-profile-loaded': [SolidUserProfile, SolidStore];
    }
}
