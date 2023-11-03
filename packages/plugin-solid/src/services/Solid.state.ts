import { defineServiceState } from '@aerogel/core';
import type { ErrorSource } from '@aerogel/core';
import type { Fetch, SolidUserProfile } from '@noeldemartin/solid-utils';

import type { AuthSession } from '@/auth/Authenticator';
import type { AuthenticatorName } from '@/auth';

export default defineServiceState({
    name: 'solid',
    persist: ['autoReconnect', 'dismissed', 'previousSession', 'profiles', 'staleProfiles'],
    initialState: {
        autoReconnect: false,
        dismissed: false,
        ignorePreviousSessionError: false,
        loginStartupError: null as ErrorSource | null,
        loginOngoing: false,
        preferredAuthenticator: null as AuthenticatorName | null,
        previousSession: null as {
            authenticator: AuthenticatorName;
            loginUrl: string;
            avatarUrl?: string;
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
        loggedIn: (state) => !!state.session,
        user: (state) => state.session?.user ?? null,
        userAvatarUrl: (state) => state.session?.user?.avatarUrl ?? state.previousSession?.avatarUrl ?? null,
        wasLoggedIn: (state) => !!state.previousSession?.loginUrl,
        authenticator: (state) => state.session?.authenticator ?? null,
        hasLoggedIn(): boolean {
            return this.loggedIn || this.wasLoggedIn;
        },
        fetch(): Fetch {
            return this.authenticator?.getAuthenticatedFetch() ?? window.fetch.bind(window);
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
