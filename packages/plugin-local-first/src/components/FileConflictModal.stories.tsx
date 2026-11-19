import { ModalStory, modalStoryParameters } from '@aerogel/storybook';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { FileConflictType } from 'soukai-bis';

import FileConflictModal from './FileConflictModal.vue';

interface StoryArgs {
    type: FileConflictType;
    title?: string;
    message?: string;
    keepLocalText?: string;
    keepRemoteText?: string;
}

type Story = StoryObj<typeof meta>;

const meta: Meta<StoryArgs> = {
    title: 'Local First/FileConflictModal',
    component: FileConflictModal,
    tags: ['!autodocs'],
    parameters: modalStoryParameters,
    argTypes: {
        type: {
            options: ['modified-remotely', 'deleted-remotely', 'deleted-locally'],
            control: { type: 'select' },
        },
    },
    args: {
        type: 'modified-remotely',
        title: '',
        message: '',
        keepLocalText: '',
        keepRemoteText: '',
    },
    render: (args) => ({
        setup() {
            const url = 'https://alice.example/manga/one-piece/001/en/001.png';

            return () => (
                <ModalStory
                    component={FileConflictModal}
                    props={{
                        conflict: {
                            type: args.type,
                            url,
                            localFile: { url, containerUrl: 'https://alice.example/manga/one-piece/001/en/' },
                            remoteUpdatedAt: null,
                        },
                        prompt: {
                            title: args.title || undefined,
                            message: args.message || undefined,
                            keepLocalText: args.keepLocalText || undefined,
                            keepRemoteText: args.keepRemoteText || undefined,
                        },
                    }}
                />
            );
        },
    }),
};

export const ModifiedRemotely: Story = {};

export const DeletedRemotely: Story = {
    args: { type: 'deleted-remotely' },
};

export const DeletedLocally: Story = {
    args: { type: 'deleted-locally' },
};

export const CustomDescription: Story = {
    args: {
        title: 'Page changed on another device',
        message: 'This page was replaced on another device. Which one do you want to keep?',
        keepLocalText: 'Keep mine',
        keepRemoteText: 'Keep theirs',
    },
};

export default meta;
