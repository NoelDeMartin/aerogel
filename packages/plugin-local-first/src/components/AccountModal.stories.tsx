import { CloudStatus } from '@aerogel/plugin-local-first/services/Cloud.state';
import {
    accountStoryArgTypes,
    accountStoryArgs,
    useAccountState,
    type AccountStoryArgs,
} from '@aerogel/plugin-local-first/testing/storybook';
import { ModalStory, modalStoryParameters } from '@aerogel/storybook';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import AccountModal from './AccountModal.vue';

type Story = StoryObj<typeof meta>;

const meta: Meta<AccountStoryArgs> = {
    title: 'Local First/AccountModal',
    component: AccountModal,
    parameters: modalStoryParameters,
    argTypes: accountStoryArgTypes,
    args: {
        ...accountStoryArgs,
        session: 'logged-in',
        cloudStatus: CloudStatus.Online,
        cloudReady: true,
    },
    render: (args) => ({
        setup() {
            useAccountState(args);

            return () => <ModalStory component={AccountModal} />;
        },
    }),
};

export const UpToDate: Story = {};

export const LocalChanges: Story = {
    args: { localChanges: 3 },
};

export const Syncing: Story = {
    args: { cloudStatus: CloudStatus.Syncing },
};

export const Offline: Story = {
    args: { cloudStatus: CloudStatus.Offline },
};

export const NotBackedUp: Story = {
    args: { cloudReady: false },
};

export const SyncError: Story = {
    args: { syncError: 'Could not synchronize changes (fake error).' },
};

export const Reconnecting: Story = {
    args: { session: 'disconnected', cloudStatus: CloudStatus.Disconnected, loginOngoing: true },
};

export const Disconnected: Story = {
    args: { session: 'disconnected', cloudStatus: CloudStatus.Disconnected },
};

export const ConnectionError: Story = {
    args: { session: 'error', cloudStatus: CloudStatus.Disconnected },
};

export default meta;
