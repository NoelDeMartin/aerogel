import { Events, bootServices, registerErrorHandler } from '@aerogel/core';
import { bootSolidModels } from 'soukai-solid';
import type { Plugin } from '@aerogel/core';
import type { SolidStore, SolidUserProfile } from '@noeldemartin/solid-utils';

import Solid from '@/services/Solid';
import { DEFAULT_STATE } from '@/services/Solid.state';
import { defineFormValidationRules } from '@/forms/validation';
import {
    authenticators as baseAuthenticators,
    getAuthenticator,
    registerAuthenticators,
    setDefaultAuthenticator,
} from '@/auth';
import { AuthenticationFailedError } from '@/errors';
import type Authenticator from '@/auth/Authenticator';
import type { AuthenticatorName } from '@/auth';

const services = { $solid: Solid };

export * from './auth';
export * from './components';
export * from './errors';
export * from './services/Solid';
export { Solid };

export interface Options {
    autoReconnect?: boolean;
    authenticators?: Record<string, Authenticator>;
    defaultAuthenticator?: AuthenticatorName;
    onUserProfileLoaded?(user: SolidUserProfile, store: SolidStore): Promise<unknown> | unknown;
}

export type SolidServices = typeof services;

export default function solid(options: Options = {}): Plugin {
    return {
        async install(app) {
            bootSolidModels();
            registerAuthenticators({ ...baseAuthenticators, ...(options.authenticators ?? {}) });
            defineFormValidationRules();
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

            await bootServices(app, services);
        },
    };
}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties extends SolidServices {}
}
