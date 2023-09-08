import { defineServiceState } from '@aerogel/core';
import type { ErrorSource } from '@aerogel/core';
import type { SolidUserProfile } from '@noeldemartin/solid-utils';

import type { AuthSession } from '@/auth/Authenticator';
import type { AuthenticatorName } from '@/auth';

export default defineServiceState({
    persist: ['autoReconnect', 'dismissed', 'previousSession', 'profiles', 'staleProfiles'],
    initialState: {
        autoReconnect: true,
        dismissed: false,
        ignorePreviousSessionError: false,
        loginError: null as ErrorSource | null,
        ongoing: false,
        preferredAuthenticator: null as AuthenticatorName | null,
        previousSession: null as {
            authenticator: AuthenticatorName;
            loginUrl: string;
            avatarUrl?: string;
            error: ErrorSource | null;
        } | null,
        profiles: {} as Record<string, SolidUserProfile>,
        session: null as AuthSession | null,
        stale: false,
        staleProfiles: [] as string[],
    },
    serialize(state) {
        if (state.previousSession?.error instanceof Error) {
            state.previousSession.error = state.previousSession.error.message;
        }

        return state;
    },
    computed: {
        authenticator: (state) => state.session?.authenticator ?? null,
        error: (state) => {
            if (state.loginError) {
                return state.loginError ?? null;
            }

            if (state.ignorePreviousSessionError) {
                return null;
            }

            return state.previousSession?.error ?? null;
        },
        fetch: (state) => {
            // TODO avoid duplicating computed states
            const authenticator = state.session?.authenticator ?? null;

            return authenticator?.getAuthenticatedFetch() ?? window.fetch.bind(window);
        },
        hasLoggedIn: (state) => {
            // TODO avoid duplicating computed states
            const loggedIn = !!state.session;
            const wasLoggedIn = !!state.previousSession?.loginUrl;

            return loggedIn || wasLoggedIn;
        },
        loggedIn: (state) => !!state.session,
        user: (state) => state.session?.user ?? null,
        userAvatarUrl: (state) => state.session?.user?.avatarUrl ?? state.previousSession?.avatarUrl ?? null,
        wasLoggedIn: (state) => !!state.previousSession?.loginUrl,
    },
});
