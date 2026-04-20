import { defineServiceState } from '@aerogel/core';
import type { ErrorSource } from '@aerogel/core';
import type { Fetch, SolidUserProfile } from '@noeldemartin/solid-utils';

import type { AuthSession } from '@aerogel/plugin-solid/auth/Authenticator';
import type { AuthenticatorName } from '@aerogel/plugin-solid/auth';

export const DEFAULT_STATE = { autoReconnect: true };

export default defineServiceState({
    name: 'solid',
    persist: ['autoReconnect', 'dismissed', 'previousSession', 'profiles', 'staleProfiles'],
    initialState: {
        autoReconnect: DEFAULT_STATE.autoReconnect,
        dismissed: false,
        ignorePreviousSessionError: false,
        loginStartupError: null as ErrorSource | null,
        loginOngoing: false,
        preferredAuthenticator: null as AuthenticatorName | null,
        previousSession: null as {
            profile?: SolidUserProfile;
            authenticator: AuthenticatorName;
            loginUrl: string;
            error: ErrorSource | null;
        } | null,
        profiles: {} as Record<string, SolidUserProfile>,
        session: null as AuthSession | null,
        loginStale: false,
        staleProfiles: [] as string[],
    },
    serialize(state) {
        if (state.previousSession?.error instanceof Error) {
            state.previousSession.error = state.previousSession.error.message;
        }

        return state;
    },
    computed: {
        user: (state) => state.session?.user ?? state.previousSession?.profile ?? null,
        authenticator: (state) => state.session?.authenticator ?? null,
        fetch(): Fetch {
            return this.authenticator?.getAuthenticatedFetch() ?? globalThis.fetch.bind(globalThis);
        },
        error(state): ErrorSource | null {
            if (state.loginStartupError) {
                return state.loginStartupError ?? null;
            }

            if (state.ignorePreviousSessionError) {
                return null;
            }

            return state.previousSession?.error ?? null;
        },
    },
});
