import { App, Errors } from '@aerogel/core';
import Cloud from '@aerogel/plugin-local-first/services/Cloud';
import { CloudStatus } from '@aerogel/plugin-local-first/services/Cloud.state';
import type { TCloudStatus } from '@aerogel/plugin-local-first/services/Cloud.state';
import { Solid } from '@aerogel/plugin-solid';
import type { Authenticator } from '@aerogel/plugin-solid';
import { useServiceState, useServiceStub } from '@aerogel/storybook';
import type { SolidUserProfile } from '@noeldemartin/solid-utils';
import { after, stringToSlug } from '@noeldemartin/utils';
import type { ArgTypes } from '@storybook/vue3-vite';
import { onScopeDispose } from 'vue';

export const AccountSessions = ['logged-out', 'logged-in', 'disconnected', 'error'] as const;

export type AccountSession = (typeof AccountSessions)[number];

export interface AccountStoryArgs {
    environment: 'development' | 'production';
    session: AccountSession;
    userName: string;
    loginOngoing: boolean;
    loginFails: boolean;
    cloudStatus: TCloudStatus;
    cloudReady: boolean;
    localChanges: number;
    syncError: string;
}

export const accountStoryArgs: AccountStoryArgs = {
    environment: 'production',
    session: 'logged-out',
    userName: 'Alice Cooper',
    loginOngoing: false,
    loginFails: false,
    cloudStatus: CloudStatus.Disconnected,
    cloudReady: false,
    localChanges: 0,
    syncError: '',
};

export const accountStoryArgTypes = {
    environment: {
        control: 'inline-radio',
        options: ['development', 'production'],
        description: 'App environment (the login form shows a dev server shortcut in development).',
    },
    session: {
        control: 'select',
        options: AccountSessions,
        description:
            'Solid session: `disconnected` and `error` mean that there is a previous session, but it is not active.',
    },
    userName: { control: 'text' },
    loginOngoing: { control: 'boolean' },
    loginFails: {
        control: 'boolean',
        description: 'Whether simulated login attempts should fail (log in attempts never leave Storybook).',
    },
    cloudStatus: { control: 'select', options: Object.values(CloudStatus) },
    cloudReady: { control: 'boolean', description: 'Whether data has been backed up to the Solid POD.' },
    localChanges: { control: { type: 'number', min: 0 } },
    syncError: { control: 'text' },
} satisfies ArgTypes<AccountStoryArgs>;

/**
 * Fakes the Solid session and Cloud state using story args, and stubs methods with side-effects (such as logging in,
 * which would otherwise redirect to an identity provider).
 *
 * Must be called within a component setup function.
 */
export function useAccountState(args: Partial<AccountStoryArgs>): void {
    const arg = <T extends keyof AccountStoryArgs>(name: T): AccountStoryArgs[T] =>
        args[name] ?? accountStoryArgs[name];
    const authenticator = { name: 'inrupt', getAuthenticatedFetch: () => null } as unknown as Authenticator;
    let disposed = false;

    useServiceState(App, () => ({ environment: arg('environment') }));
    useServiceState(Solid, () => {
        const session = arg('session');
        const profile = fakeProfile(arg('userName'));

        return {
            loginOngoing: arg('loginOngoing'),
            ignorePreviousSessionError: false,
            loginStartupError: null,
            session: session === 'logged-in' ? { user: profile, loginUrl: profile.webId, authenticator } : null,
            previousSession:
                session === 'logged-out'
                    ? null
                    : {
                          profile,
                          loginUrl: profile.webId,
                          authenticator: 'inrupt' as const,
                          error: session === 'error' ? `Could not connect to \`${profile.webId}\` (fake error).` : null,
                      },
        };
    });
    useServiceState(Cloud, () => ({
        status: arg('cloudStatus'),
        ready: arg('cloudReady'),
        localModelUpdates: (arg('localChanges') > 0
            ? { 'solid://storybook/fake-model': arg('localChanges') }
            : {}) as Record<string, number>,
        syncError: arg('syncError') || null,
        syncJob: null,
    }));

    useServiceStub(Solid, 'login', async (loginUrl) => {
        // oxlint-disable-next-line no-console
        console.info(`[Storybook] Simulating login to ${loginUrl}`);

        Solid.setState({ loginOngoing: true });

        await after(2000);

        if (disposed) {
            return false;
        }

        Solid.setState({ loginOngoing: false });

        if (arg('loginFails')) {
            await Errors.report(new Error(`Could not log in to ${loginUrl} (fake error).`));
        }

        return false;
    });
    useServiceStub(Solid, 'reconnect', async () => {
        await Solid.login(fakeProfile(arg('userName')).webId);
    });
    useServiceStub(Solid, 'logout', async () => {
        // oxlint-disable-next-line no-console
        console.info('[Storybook] Simulating logout');
    });
    useServiceStub(Cloud, 'sync', async () => {
        // oxlint-disable-next-line no-console
        console.info('[Storybook] Simulating synchronization');

        Cloud.setState({ status: CloudStatus.Syncing });

        await after(2000);

        if (disposed) {
            return;
        }

        Cloud.setState({ status: arg('cloudStatus'), localModelUpdates: {} });
    });
    useServiceStub(Cloud, 'setup', async () => {
        // oxlint-disable-next-line no-console
        console.info('[Storybook] Simulating cloud setup');
    });

    onScopeDispose(() => (disposed = true));
}

function fakeProfile(name: string): SolidUserProfile {
    const slug = stringToSlug(name) || 'anonymous';

    return {
        name: name || undefined,
        webId: `https://${slug}.example/profile/card#me`,
        storageUrls: [`https://${slug}.example/`],
        cloaked: false,
        writableProfileUrl: null,
    };
}
