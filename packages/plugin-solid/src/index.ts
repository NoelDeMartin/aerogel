import {
    Cache,
    Errors,
    Events,
    appNamespace,
    bootServices,
    registerErrorHandler,
    registerFakeService,
} from '@aerogel/core';
import type { Plugin } from '@aerogel/core';
import {
    authenticators as baseAuthenticators,
    getAuthenticator,
    registerAuthenticators,
    setDefaultAuthenticator,
} from '@aerogel/plugin-solid/auth';
import type { AuthenticatorName } from '@aerogel/plugin-solid/auth';
import type Authenticator from '@aerogel/plugin-solid/auth/Authenticator';
import { AuthenticationFailedError } from '@aerogel/plugin-solid/errors';
import { services } from '@aerogel/plugin-solid/services';
import Solid from '@aerogel/plugin-solid/services/Solid';
import SolidFake from '@aerogel/plugin-solid/services/Solid.fake';
import { DEFAULT_STATE } from '@aerogel/plugin-solid/services/Solid.state';
import { setupSoukai } from '@aerogel/plugin-solid/utils/soukai';
import ModelsWorker from '@aerogel/plugin-solid/workers/ModelsWorker';
import {
    clearTrackedModels,
    resetReactiveState,
    setComputedModelsCache,
    setErrorReporter,
    setModelsWorkerLoader,
} from '@aerogel/reactivity';
import type { SolidUserProfile, SolidStore } from '@noeldemartin/solid-utils';
import { ComputedAttributesCache, InMemoryEngine, IndexedDBEngine } from 'soukai-bis';
import appModels from 'virtual:aerogel-models';

import { testingRuntime } from './testing';

function setupTestingRuntime(): void {
    if (!globalThis.testingRuntime) {
        return;
    }

    Object.assign(globalThis.testingRuntime, testingRuntime);
}

export * from './auth';
export * from './components';
export * from './composables';
export * from './errors';
export * from './forms';
export * from './services';
export * from './testing';
export * from './utils';

export interface Options {
    autoReconnect?: boolean;
    authenticators?: Record<string, Authenticator>;
    defaultAuthenticator?: AuthenticatorName | (() => AuthenticatorName);
    onUserProfileLoaded?(user: SolidUserProfile, store: SolidStore): unknown;
}

export default function solid(options: Options = {}): Plugin {
    return {
        async install(app) {
            registerFakeService(Solid, SolidFake);

            const engine = globalThis.__aerogelStorybook__ ? new InMemoryEngine() : new IndexedDBEngine();

            setupSoukai({ engine, namespace: appNamespace(), models: appModels });
            setErrorReporter((error) => Errors.report(error));
            setComputedModelsCache(Cache);
            setModelsWorkerLoader(() => new ModelsWorker(appNamespace()));

            globalThis.__aerogelStorybook__ && resetReactiveState();

            setupTestingRuntime();
            registerAuthenticators({ ...baseAuthenticators, ...options.authenticators });
            setDefaultAuthenticator(
                getAuthenticator(
                    typeof options.defaultAuthenticator === 'function'
                        ? options.defaultAuthenticator()
                        : (options.defaultAuthenticator ?? 'uvdsl'),
                ),
            );
            registerErrorHandler((error) => {
                if (!(error instanceof AuthenticationFailedError)) {
                    return;
                }
                return error.description ? `${error.message} (${error.description})` : error.message;
            });

            if (typeof options.autoReconnect === 'boolean') {
                DEFAULT_STATE.autoReconnect = options.autoReconnect;
                Solid.hasPersistedState() || (Solid.autoReconnect = options.autoReconnect);
            }

            if (options.onUserProfileLoaded) {
                Events.on('solid:user-profile-loaded', ([user, store]) => {
                    options.onUserProfileLoaded?.(user, store);
                });
            }

            Events.on('purge-storage', () => engine instanceof IndexedDBEngine && engine.clear());
            Events.on('purge-storage', () => clearTrackedModels());
            Events.on('clear-cache', () => engine.purgeMetadata());
            Events.on('clear-cache', () => ComputedAttributesCache.clear());

            await bootServices(app, services);
        },
    };
}
