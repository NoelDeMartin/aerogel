import { IndexedDBEngine, bootCoreModels, bootModelsFromViteGlob, setEngine, setNamespace } from 'soukai-bis';
import { Events, appNamespace, bootServices, registerErrorHandler } from '@aerogel/core';
import type { Plugin } from '@aerogel/core';
import type { SolidStore, SolidUserProfile } from '@noeldemartin/solid-utils';

import Solid from '@aerogel/plugin-solid/services/Solid';
import { services } from '@aerogel/plugin-solid/services';
import { DEFAULT_STATE } from '@aerogel/plugin-solid/services/Solid.state';
import {
    authenticators as baseAuthenticators,
    getAuthenticator,
    registerAuthenticators,
    setDefaultAuthenticator,
} from '@aerogel/plugin-solid/auth';
import { AuthenticationFailedError } from '@aerogel/plugin-solid/errors';
import type Authenticator from '@aerogel/plugin-solid/auth/Authenticator';
import type { AuthenticatorName } from '@aerogel/plugin-solid/auth';

import { testingRuntime } from './testing';

function setupTestingRuntime(): void {
    if (!globalThis.testingRuntime) {
        return;
    }

    Object.assign(globalThis.testingRuntime, testingRuntime);
}

export * from './auth';
export * from './components';
export * from './errors';
export * from './forms';
export * from './services';
export * from './testing';
export * from './utils';

export interface Options {
    autoReconnect?: boolean;
    authenticators?: Record<string, Authenticator>;
    defaultAuthenticator?: AuthenticatorName | (() => AuthenticatorName);
    models?: Record<string, Record<string, unknown>>;
    onUserProfileLoaded?(user: SolidUserProfile, store: SolidStore): Promise<unknown> | unknown;
}

export default function solid(options: Options = {}): Plugin {
    return {
        async install(app) {
            const engine = new IndexedDBEngine();

            setupTestingRuntime();
            setEngine(engine);
            setNamespace(appNamespace());
            bootCoreModels({ reset: true });
            bootModelsFromViteGlob(options.models ?? {}, { reset: true });
            registerAuthenticators({ ...baseAuthenticators, ...options.authenticators });
            setDefaultAuthenticator(
                getAuthenticator(
                    typeof options.defaultAuthenticator === 'function'
                        ? options.defaultAuthenticator()
                        : (options.defaultAuthenticator ?? 'inrupt'),
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

            Events.on('purge-storage', () => engine.clear());

            await bootServices(app, services);
        },
    };
}
