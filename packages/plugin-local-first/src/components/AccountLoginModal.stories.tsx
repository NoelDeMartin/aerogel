import {
    accountStoryArgTypes,
    accountStoryArgs,
    useAccountState,
    type AccountStoryArgs,
} from '@aerogel/plugin-local-first/testing/storybook';
import { ModalStory, modalStoryParameters } from '@aerogel/storybook';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import AccountLoginModal from './AccountLoginModal.vue';

type Story = StoryObj<typeof meta>;

type StoryArgs = Pick<AccountStoryArgs, 'environment' | 'loginOngoing' | 'loginFails'>;

const meta: Meta<StoryArgs> = {
    title: 'Local First/AccountLoginModal',
    component: AccountLoginModal,
    parameters: modalStoryParameters,
    argTypes: {
        environment: accountStoryArgTypes.environment,
        loginOngoing: accountStoryArgTypes.loginOngoing,
        loginFails: accountStoryArgTypes.loginFails,
    },
    args: {
        environment: accountStoryArgs.environment,
        loginOngoing: accountStoryArgs.loginOngoing,
        loginFails: accountStoryArgs.loginFails,
    },
    render: (args) => ({
        setup() {
            useAccountState(args);

            return () => <ModalStory component={AccountLoginModal} />;
        },
    }),
};

export const Default: Story = {};

export const Development: Story = {
    args: { environment: 'development' },
};

export const LoginOngoing: Story = {
    args: { loginOngoing: true },
};

export const LoginError: Story = {
    args: { loginFails: true },
};

export default meta;
