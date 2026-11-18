import { ModalStory, modalStoryParameters } from '@aerogel/storybook';
import { SolidDocument } from '@noeldemartin/solid-utils';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { bootModels, defineSchema } from 'soukai-bis';
import type { DeletionConflictType } from 'soukai-bis';
import { z } from 'zod';

import DeletionConflictModal from './DeletionConflictModal.vue';

interface StoryArgs {
    type: DeletionConflictType;
    withModel?: boolean;
    title?: string;
    message?: string;
    deleteText?: string;
    restoreText?: string;
}

class Movie extends defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'Movie',
    fields: { name: z.string() },
}) {}

type Story = StoryObj<typeof meta>;

const meta: Meta<StoryArgs> = {
    title: 'Local First/DeletionConflictModal',
    component: DeletionConflictModal,
    tags: ['!autodocs'],
    parameters: modalStoryParameters,
    argTypes: {
        type: {
            options: ['deleted-remotely', 'deleted-locally'],
            control: { type: 'select' },
        },
    },
    args: {
        type: 'deleted-remotely',
        withModel: false,
        title: '',
        message: '',
        deleteText: '',
        restoreText: '',
    },
    render: (args) => ({
        setup() {
            const document = new SolidDocument('https://alice.example/movies/spirited-away', []);
            const resourceUrl = `${document.url}#it`;

            bootModels({ Movie }, { reset: true });

            return () => (
                <ModalStory
                    component={DeletionConflictModal}
                    props={{
                        conflict: {
                            type: args.type,
                            resourceUrl,
                            localDocument: document,
                            remoteDocument: document,
                        },
                        model: args.withModel ? new Movie({ url: resourceUrl, name: 'Spirited Away' }) : null,
                        prompt: {
                            title: args.title || undefined,
                            message: args.message || undefined,
                            deleteText: args.deleteText || undefined,
                            restoreText: args.restoreText || undefined,
                        },
                    }}
                />
            );
        },
    }),
};

export const DeletedRemotely: Story = {};

export const DeletedLocally: Story = {
    args: { type: 'deleted-locally' },
};

export const WithModel: Story = {
    args: { withModel: true },
};

export const CustomDescription: Story = {
    args: {
        title: 'Movie deleted on another device',
        message:
            '*Spirited Away* was deleted on another device, but you watched it on this one. Do you want to keep it?',
        deleteText: 'Delete it',
        restoreText: 'Keep it',
    },
};

export default meta;
