import { Events, appNamespace, bootServices, registerErrorHandler } from '@aerogel/core';
import { IndexedDBEngine, bootCoreModels, bootModelsFromViteGlob, setEngine } from 'soukai-bis';
import type { Plugin } from '@aerogel/core';
import type { SolidStore, SolidUserProfile } from '@noeldemartin/solid-utils';

import Solid from '@aerogel/plugin-solid/services/Solid';
import { DEFAULT_STATE } from '@aerogel/plugin-solid/services/Solid.state';
import { registerFormValidationRules } from '@aerogel/plugin-solid/forms/validation';
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

const services = { $solid: Solid };

function setupTestingRuntime(): void {
    if (!globalThis.testingRuntime) {
        return;
    }

    Object.assign(globalThis.testingRuntime, testingRuntime);
}

export * from './auth';
export * from './components';
export * from './errors';
export * from './services/Solid';
export * from './testing';
export * from './utils';

export { Solid };

export interface Options {
    autoReconnect?: boolean;
    authenticators?: Record<string, Authenticator>;
    defaultAuthenticator?: AuthenticatorName;
    models?: Record<string, Record<string, unknown>>;
    onUserProfileLoaded?(user: SolidUserProfile, store: SolidStore): Promise<unknown> | unknown;
}

export type SolidServices = typeof services;

export default function solid(options: Options = {}): Plugin {
    return {
        async install(app) {
            const engine = new IndexedDBEngine(appNamespace());

            setupTestingRuntime();
            setEngine(engine);
            bootCoreModels({ reset: true });
            bootModelsFromViteGlob(options.models ?? {});
            registerAuthenticators({ ...baseAuthenticators, ...(options.authenticators ?? {}) });
            registerFormValidationRules();
            setDefaultAuthenticator(getAuthenticator(options.defaultAuthenticator ?? 'inrupt'));
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

declare module '@aerogel/core' {
    interface Services extends SolidServices {}
}
