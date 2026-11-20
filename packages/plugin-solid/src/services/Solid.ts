import { App, Errors, Events, NetworkCache, Storage, UI, translateWithDefault } from '@aerogel/core';
import type { ErrorSource } from '@aerogel/core';
import { getAuthenticator } from '@aerogel/plugin-solid/auth';
import type { AuthenticatorName } from '@aerogel/plugin-solid/auth';
import type Authenticator from '@aerogel/plugin-solid/auth/Authenticator';
import type { AuthenticatorBootOptions, AuthSession } from '@aerogel/plugin-solid/auth/Authenticator';
import { ContainerAlreadyInUse } from '@aerogel/plugin-solid/errors';
import AuthenticationCancelledError from '@aerogel/plugin-solid/errors/AuthenticationCancelledError';
import { fileResponse } from '@aerogel/plugin-solid/utils/files';
import { SolidDocumentPermissions, fetchLoginUserProfile } from '@noeldemartin/solid-utils';
import type { SolidUserProfile, Fetch, SolidStore, CompleteSolidUserProfile } from '@noeldemartin/solid-utils';
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
    required,
    resetAsyncMemo,
    setAsyncMemo,
    tap,
    urlRoot,
} from '@noeldemartin/utils';
import type { NullablePartial } from '@noeldemartin/utils';
import {
    Container,
    SolidEngine,
    TypeIndex,
    DocumentNotFound,
    getLocalEngine,
    getRemoteEngine,
    isLocalUrl,
    remote,
    setEngine,
    setRemoteEngine,
} from 'soukai-bis';
import type { ContainerConstructor, Model, ModelConstructor, ModelWithUrl, TypeIndexRegistration } from 'soukai-bis';

import Service, { DEFAULT_STATE } from './Solid.state';

export type LoginOptions = NullablePartial<{
    authenticator: AuthenticatorName;
    onError(error: ErrorSource): unknown;
    fallbackUrl: string;
    loading: boolean;
    skipProfile?: boolean;
    extra?: Record<string, unknown>;
}>;

export type UserProfileOptions = NullablePartial<{
    required: boolean;
    markStale: boolean;
    fetch: Fetch;
    shallow: boolean;
}>;

export type ShallowUserProfileOptions = Omit<UserProfileOptions, 'shallow'> & { shallow: true };
export type CompleteUserProfileOptions = Omit<UserProfileOptions, 'shallow'> & { shallow?: false | null };
export type RequiredUserProfileOptions = { required: true };

export type ReconnectOptions = Omit<LoginOptions, 'authenticator'> & {
    force?: boolean;
};

export interface ReadFileOptions {
    cache?: boolean;
}

export interface SolidFileEventPayload {
    url: string;
}

export interface CreateContainerOptions {
    url: string;
    name?: string;
    register?: ModelConstructor;
    reuseExisting?: boolean;
}

export interface FindRegisteredInstancesOptions {
    registration?: TypeIndexRegistration;
}

export interface FindRegisteredContainersOptions<
    T extends Container = Container,
> extends FindRegisteredInstancesOptions {
    containerModelClass?: ContainerConstructor<T>;
}

export class SolidService extends Service {
    private _engine?: SolidEngine;

    public isLoggedIn(): this is {
        session: AuthSession;
        user: CompleteSolidUserProfile;
        authenticator: Authenticator;
    } {
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

    public requireEngine(): SolidEngine {
        return (this._engine ??= new SolidEngine({
            fetch: (...args: [RequestInfo]) => this.fetch(...args),
        }));
    }

    public requireUser(): CompleteSolidUserProfile {
        if (!this.user || this.user.shallow) {
            throw new Error('Could not get user profile (are you logged in?)');
        }

        return this.user;
    }

    public requireUserProfile(url: string, options: Omit<ShallowUserProfileOptions, 'required'>): Promise<SolidUserProfile>; // prettier-ignore
    public requireUserProfile(url: string, options?: Omit<CompleteUserProfileOptions, 'required'>): Promise<CompleteSolidUserProfile>; // prettier-ignore
    public requireUserProfile(url: string, options?: Omit<UserProfileOptions, 'required'>): Promise<SolidUserProfile>;

    public requireUserProfile(
        url: string,
        options: Omit<UserProfileOptions, 'required'> = {},
    ): Promise<SolidUserProfile> {
        return this.getUserProfile(url, { ...options, required: true });
    }

    public async getUserProfile(url: string, options: ShallowUserProfileOptions & RequiredUserProfileOptions): Promise<SolidUserProfile>; // prettier-ignore
    public async getUserProfile(url: string, options: CompleteUserProfileOptions & RequiredUserProfileOptions): Promise<CompleteSolidUserProfile>; // prettier-ignore
    public async getUserProfile(url: string, options: UserProfileOptions & RequiredUserProfileOptions): Promise<SolidUserProfile>; // prettier-ignore
    public async getUserProfile(url: string, options: ShallowUserProfileOptions): Promise<SolidUserProfile | null>; // prettier-ignore
    public async getUserProfile(
        url: string,
        options?: CompleteUserProfileOptions,
    ): Promise<CompleteSolidUserProfile | null>;
    public async getUserProfile(url: string, options?: UserProfileOptions): Promise<SolidUserProfile | null>;

    public async getUserProfile(url: string, options: UserProfileOptions = {}): Promise<SolidUserProfile | null> {
        let profileStore: SolidStore | null = null;
        const shallow = options.shallow ?? false;
        const authenticatedFetch = options.fetch ?? this.authenticator?.getAuthenticatedFetch();
        const markStale = options.markStale ?? !authenticatedFetch;
        const cachedProfile = this.profiles[url];
        const userProfile =
            (cachedProfile && (shallow || !cachedProfile.shallow) ? cachedProfile : null) ??
            (await tap(
                await fetchLoginUserProfile(url, {
                    fetch: authenticatedFetch ?? this.fetch,
                    required: options.required ?? false,
                    shallow,
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
        this.clearTypeIndexesCache();

        const user = await this.requireUserProfile(this.user.webId);

        this.setState({
            session: {
                ...this.session,
                user,
            },
            ...(this.previousSession?.profile?.webId === user.webId
                ? {
                      previousSession: {
                          ...this.previousSession,
                          profile: user,
                      },
                  }
                : {}),
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
        const [confirmLogout, options] = await this.confirmLogout(force);

        if (!confirmLogout || !this.previousSession) {
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
            await App.reload();
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

    public async findRegisteredContainers<T extends Container = Container>(
        modelClass: ModelConstructor,
        options: FindRegisteredContainersOptions<T> = {},
    ): Promise<ModelWithUrl<T>[]> {
        const typeIndexes = await this.findTypeIndexesForRegistration(options.registration);
        const containers = await Promise.all(
            typeIndexes.map((typeIndex) => typeIndex.findContainers(modelClass, options.containerModelClass)),
        );

        return arrayUnique(containers.flat(), (container) => container.url);
    }

    public async findRegisteredInstances<T extends Model>(
        modelClass: ModelConstructor<T>,
        options: FindRegisteredInstancesOptions = {},
    ): Promise<ModelWithUrl<T>[]> {
        const typeIndexes = await this.findTypeIndexesForRegistration(options.registration);
        const instances = await Promise.all(typeIndexes.map((typeIndex) => typeIndex.findInstances(modelClass)));

        return arrayUnique(instances.flat(), (instance) => instance.url);
    }

    public async findTypeIndexes(options: { fresh?: boolean } = {}): Promise<{
        publicTypeIndexes: ModelWithUrl<TypeIndex>[];
        privateTypeIndexes: ModelWithUrl<TypeIndex>[];
    }> {
        const [publicTypeIndexes, privateTypeIndexes] = await Promise.all([
            this.findPublicTypeIndexes(options),
            this.findPrivateTypeIndexes(options),
        ]);

        return { publicTypeIndexes, privateTypeIndexes };
    }

    public async findOrCreatePublicTypeIndex(): Promise<ModelWithUrl<TypeIndex>> {
        return (await this.findPublicTypeIndexes())[0] ?? (await this.createPublicTypeIndex());
    }

    public async findOrCreatePrivateTypeIndex(): Promise<ModelWithUrl<TypeIndex>> {
        return (await this.findPrivateTypeIndexes())[0] ?? (await this.createPrivateTypeIndex());
    }

    public async findPrivateTypeIndexes(options: { fresh?: boolean } = {}): Promise<ModelWithUrl<TypeIndex>[]> {
        return this.findTypeIndexesByVisibility('private', options);
    }

    public async findPublicTypeIndexes(options: { fresh?: boolean } = {}): Promise<ModelWithUrl<TypeIndex>[]> {
        return this.findTypeIndexesByVisibility('public', options);
    }

    public clearTypeIndexesCache(): void {
        const { webId } = this.requireUser();

        resetAsyncMemo(this.typeIndexesCacheKey(webId, 'public'));
        resetAsyncMemo(this.typeIndexesCacheKey(webId, 'private'));
    }

    public async readFileIfExists(url: string, options: ReadFileOptions = {}): Promise<Blob | null> {
        const localFile = await getLocalEngine()?.getFile(url);

        if (localFile?.deleted) {
            return null;
        }

        if (localFile?.blob) {
            return localFile.blob;
        }

        if (isLocalUrl(url)) {
            return null;
        }

        const useCache = options.cache ?? true;
        const cachedResponse = useCache ? await NetworkCache.get(url) : null;

        if (cachedResponse) {
            return cachedResponse.blob();
        }

        const blob = await getRemoteEngine()?.readFileIfExists(url);

        if (blob && useCache) {
            await NetworkCache.store(url, fileResponse(blob));
        }

        return blob ?? null;
    }

    public async readFile(url: string, options: ReadFileOptions = {}): Promise<Blob> {
        const blob = await this.readFileIfExists(url, options);

        if (!blob) {
            throw new DocumentNotFound(url);
        }

        return blob;
    }

    public async createPrivateContainer(options: CreateContainerOptions): Promise<ModelWithUrl<Container>> {
        return this.createContainer(options, 'private');
    }

    public async createPublicContainer(options: CreateContainerOptions): Promise<ModelWithUrl<Container>> {
        return this.createContainer(options, 'public');
    }

    protected async createContainer(
        options: CreateContainerOptions,
        visibility: TypeIndexRegistration,
    ): Promise<ModelWithUrl<Container>> {
        const RemoteContainer = remote(Container);
        const existingContainer = await RemoteContainer.find(options.url);

        if (existingContainer && !options.reuseExisting) {
            throw new ContainerAlreadyInUse(existingContainer);
        }

        const remoteContainer = existingContainer ?? new RemoteContainer({ url: options.url, name: options.name });

        await remoteContainer.save();

        if (visibility === 'public') {
            await remoteContainer.updatePublicPermissions([SolidDocumentPermissions.Read]);
        }

        if (options.register) {
            const typeIndex =
                visibility === 'public'
                    ? await this.findOrCreatePublicTypeIndex()
                    : await this.findOrCreatePrivateTypeIndex();

            await remoteContainer.register(typeIndex, options.register);
        }

        const container = await Container.createFromJsonLD(await remoteContainer.toJsonLD(), {
            url: remoteContainer.url,
        });

        return required(container);
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

        this.prepareEngines();
        this.watchContainerFiles();

        await this.restorePreviousSession();
        await this.startupReconnect();
    }

    protected async findTypeIndexesForRegistration(
        registration?: TypeIndexRegistration,
    ): Promise<ModelWithUrl<TypeIndex>[]> {
        const [publicTypeIndexes, privateTypeIndexes] = await Promise.all([
            registration === 'private' ? [] : this.findPublicTypeIndexes(),
            registration === 'public' ? [] : this.findPrivateTypeIndexes(),
        ]);

        return [...publicTypeIndexes, ...privateTypeIndexes];
    }

    protected async findTypeIndexesByUrl(
        urls: string[],
        registration: TypeIndexRegistration,
    ): Promise<ModelWithUrl<TypeIndex>[]> {
        const typeIndexes = await Promise.all(
            urls.map(async (url) => {
                const typeIndex = await TypeIndex.find(url);

                typeIndex?.setRegistration(registration);

                return typeIndex;
            }),
        );

        return arrayFilter(typeIndexes);
    }

    protected async createPublicTypeIndex(): Promise<ModelWithUrl<TypeIndex>> {
        return this.createTypeIndex('public');
    }

    protected async createPrivateTypeIndex(): Promise<ModelWithUrl<TypeIndex>> {
        return this.createTypeIndex('private');
    }

    private typeIndexesCacheKey(webId: string, visibility: TypeIndexRegistration): string {
        return `${webId}-${visibility}TypeIndexes`;
    }

    private async findTypeIndexesByVisibility(
        visibility: TypeIndexRegistration,
        options: { fresh?: boolean } = {},
    ): Promise<ModelWithUrl<TypeIndex>[]> {
        const user = this.requireUser();
        const cacheKey = this.typeIndexesCacheKey(user.webId, visibility);
        const urls = visibility === 'public' ? user.publicTypeIndexUrls : user.privateTypeIndexUrls;

        if (options.fresh) {
            resetAsyncMemo(cacheKey);
        }

        return asyncMemo(cacheKey, () => this.findTypeIndexesByUrl(urls, visibility));
    }

    private async createTypeIndex(visibility: TypeIndexRegistration): Promise<ModelWithUrl<TypeIndex>> {
        const user = this.requireUser();
        const typeIndex =
            visibility === 'public' ? await TypeIndex.createPublic(user) : await TypeIndex.createPrivate(user);

        return tap(typeIndex, () => {
            if (visibility === 'public') {
                user.publicTypeIndexUrls = arrayUnique([...user.publicTypeIndexUrls, typeIndex.url]);
            } else {
                user.privateTypeIndexUrls = arrayUnique([...user.privateTypeIndexUrls, typeIndex.url]);
            }

            setAsyncMemo(this.typeIndexesCacheKey(user.webId, visibility), [typeIndex]);

            this.rememberProfile(user);
        });
    }

    private async confirmLogout(force: boolean): Promise<[boolean, { wipeLocalData?: boolean }]> {
        if (!App.plugin('@aerogel/local-first')) {
            return [true, { wipeLocalData: false }];
        }

        const isCloudReady = !!App.service('$cloud')?.ready;

        if (force) {
            return [true, { wipeLocalData: isCloudReady }];
        }

        const hasLocalChanges = !!App.service('$cloud')?.dirty;
        const { title, message, checkboxes } = this.getLogoutPromptOptions(isCloudReady, hasLocalChanges);

        return UI.confirm(title, message, {
            acceptText: translateWithDefault('solid.logoutConfirmAccept', 'Log out'),
            acceptVariant: 'danger',
            cancelText: translateWithDefault('solid.logoutConfirmCancel', translateWithDefault('ui.cancel', 'Cancel')),
            checkboxes,
        });
    }

    private getLogoutPromptOptions(isCloudReady: boolean, hasLocalChanges: boolean) {
        if (!isCloudReady) {
            return {
                title: translateWithDefault('solid.disconnectConfirmTitle', 'Disconnect account?'),
                message: translateWithDefault(
                    'solid.disconnectConfirmMessage',
                    "You'll need to introduce your credentials again to connect to your Solid POD.",
                ),
                checkboxes: {
                    wipeLocalData: {
                        label: translateWithDefault('solid.logoutConfirmWipe', 'Also remove all existing data'),
                        default: false,
                    },
                },
            };
        }

        return {
            title: translateWithDefault('solid.logoutConfirmTitle', 'Log out from this device?'),
            message: hasLocalChanges
                ? translateWithDefault(
                      'solid.logoutConfirmMessageWithLocalChanges',
                      "There are some changes that haven't been synchronized and will be lost, " +
                          'but the rest of the data will remain in your Solid POD.',
                  )
                : translateWithDefault(
                      'solid.logoutConfirmMessage',
                      'Logging out will remove all the data from this device, ' +
                          "but you'll still have it in your Solid POD.",
                  ),
            checkboxes: hasLocalChanges
                ? {
                      wipeLocalData: {
                          label: translateWithDefault(
                              'solid.logoutConfirmWipeNotice',
                              "I understand that changes that haven't been synchronized will be lost.",
                          ),
                          default: false,
                          required: true,
                      },
                  }
                : undefined,
        };
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
            const profile = options.skipProfile
                ? null
                : await this.getUserProfile(loginUrl, { markStale: true, shallow: true });
            const oidcIssuerUrl = profile?.oidcIssuerUrl ?? urlRoot(profile?.webId ?? loginUrl);
            const authenticator = await this.bootAuthenticator(authenticatorName, { reconnect: false });
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
                        "We didn't hear back from the identity provider at `{domain}`, maybe try reconnecting?",
                        { domain: loginDomain },
                    ),
                }),
            });

            await Events.emit('auth:before-login');

            // This should redirect away from the app, so in most cases
            // the rest of the code won't be reached.
            await authenticator.login(oidcIssuerUrl, {
                user: profile,
                ...options.extra,
            });

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

    private prepareEngines(): void {
        const publicEngine = new SolidEngine();

        setRemoteEngine(publicEngine);
    }

    private watchContainerFiles(): void {
        Container.on('file-uploaded', async ({ url, blob }) => {
            if (!getLocalEngine()) {
                await NetworkCache.store(url, fileResponse(blob));
            }

            await Events.emit('solid:file-uploaded', { url });
        });

        Container.on('file-deleted', async ({ url }) => {
            await NetworkCache.delete(url);
            await Events.emit('solid:file-deleted', { url });
        });
    }

    private async restorePreviousSession(): Promise<void> {
        if (!this.previousSession) {
            return;
        }

        await this.bootAuthenticator(this.previousSession.authenticator, { reconnect: this.reconnectOnStartup() });
    }

    private async startupReconnect(): Promise<void> {
        if (!this.reconnectOnStartup()) {
            return;
        }

        await this.reconnect({ force: this.forcingReconnect() });
    }

    private getAutoReconnectParam(): boolean | null {
        return hasLocationQueryParameter('autoReconnect')
            ? parseBoolean(getLocationQueryParameter('autoReconnect'))
            : null;
    }

    private reconnectOnStartup(): boolean {
        return this.getAutoReconnectParam() ?? this.autoReconnect;
    }

    private forcingReconnect(): boolean {
        return this.getAutoReconnectParam() === true;
    }

    private async bootAuthenticator(
        name: AuthenticatorName,
        options: AuthenticatorBootOptions,
    ): Promise<Authenticator> {
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

                if (!App.plugin('@aerogel/local-first')) {
                    setEngine(this.requireEngine());
                }

                setRemoteEngine(this.requireEngine());

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

        await authenticator.boot(options);

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

export default facade(SolidService);

declare module '@aerogel/core' {
    export interface EventsPayload {
        'auth:fetch-ready': Fetch;
        'auth:before-login': void;
        'auth:login': AuthSession;
        'auth:logout': void;
        'auth:after-logout': void;
        'solid:user-profile-loaded': [SolidUserProfile, SolidStore];
        'solid:file-uploaded': SolidFileEventPayload;
        'solid:file-updated': SolidFileEventPayload;
        'solid:file-deleted': SolidFileEventPayload;
    }
}
