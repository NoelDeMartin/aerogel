import { AppFake } from '@aerogel/core';
import CloudFake from '@aerogel/plugin-local-first/services/Cloud.fake';
import { CloudStatus } from '@aerogel/plugin-local-first/services/Cloud.state';
import type { TCloudStatus } from '@aerogel/plugin-local-first/services/Cloud.state';
import { SolidFake } from '@aerogel/plugin-solid';
import type { ArgTypes } from '@storybook/vue3-vite';
import { watch } from 'vue';

export const AccountSessions = ['logged-out', 'logged-in', 'disconnected', 'error'] as const;

export type AccountSession = (typeof AccountSessions)[number];

export interface AccountStoryArgs {
    environment: 'development' | 'production';
    session: AccountSession;
    userName: string;
    loginOngoing: boolean;
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
    cloudStatus: { control: 'select', options: Object.values(CloudStatus) },
    cloudReady: { control: 'boolean', description: 'Whether data has been backed up to the Solid POD.' },
    localChanges: { control: { type: 'number', min: 0 } },
    syncError: { control: 'text' },
} satisfies ArgTypes<AccountStoryArgs>;

export const accountStoryParameters = {
    layout: 'fullscreen',
    docs: {
        story: {
            inline: false,
            iframeHeight: '500px',
        },
    },
};

export function useAccountState(args: Partial<AccountStoryArgs>): void {
    const arg = <T extends keyof AccountStoryArgs>(name: T): AccountStoryArgs[T] =>
        args[name] ?? accountStoryArgs[name];

    watch(
        () => ({ ...args }),
        () => {
            const session = arg('session');
            const profile = SolidFake.fakeProfile(arg('userName'));

            AppFake.setState({ environment: arg('environment') });

            SolidFake.setState({
                loginOngoing: arg('loginOngoing'),
                session: session === 'logged-in' ? SolidFake.fakeSession(profile) : null,
                previousSession:
                    session === 'logged-out'
                        ? null
                        : {
                              profile,
                              loginUrl: profile.webId,
                              authenticator: 'inrupt',
                              error:
                                  session === 'error'
                                      ? `Could not connect to \`${profile.webId}\` (fake error).`
                                      : null,
                          },
            });

            CloudFake.setState({
                status: arg('cloudStatus'),
                ready: arg('cloudReady'),
                localModelUpdates:
                    arg('localChanges') > 0 ? { 'solid://storybook/fake-model': arg('localChanges') } : {},
                syncError: arg('syncError') || null,
            });
        },
        { immediate: true },
    );
}
