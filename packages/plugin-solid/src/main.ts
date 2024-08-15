import { bootServices } from '@aerogel/core';
import { bootSolidModels } from 'soukai-solid';
import type { Plugin } from '@aerogel/core';

import Solid from '@/services/Solid';
import { DEFAULT_STATE } from '@/services/Solid.state';
import { defineFormValidationRules } from '@/forms/validation';
import {
    authenticators as baseAuthenticators,
    getAuthenticator,
    registerAuthenticators,
    setDefaultAuthenticator,
} from '@/auth';
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
}

export type SolidServices = typeof services;

export default function solid(options: Options = {}): Plugin {
    return {
        async install(app) {
            bootSolidModels();
            registerAuthenticators({ ...baseAuthenticators, ...(options.authenticators ?? {}) });
            defineFormValidationRules();
            setDefaultAuthenticator(getAuthenticator(options.defaultAuthenticator ?? 'inrupt'));

            if (typeof options.autoReconnect === 'boolean') {
                DEFAULT_STATE.autoReconnect = options.autoReconnect;

                Solid.hasPersistedState() || (Solid.autoReconnect = options.autoReconnect);
            }

            await bootServices(app, services);
        },
    };
}

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties extends SolidServices {}
}
