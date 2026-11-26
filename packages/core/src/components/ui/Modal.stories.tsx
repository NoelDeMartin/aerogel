import { ModalComponent, createModal } from '@aerogel/core/ui/modals';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent } from 'vue';

import Button from './Button.vue';
import Modal from './Modal.vue';

type Story = StoryObj<typeof meta>;

const SampleModal = defineComponent({
    setup() {
        return () => (
            <Modal title="Sample Modal" description="Inspect the close button and action button hover states.">
                <p class="text-sm">
                    Hover the close button in the top-right corner and the buttons below to verify contrast on the modal
                    surface.
                </p>
                <div class="mt-4 flex flex-wrap justify-end gap-2">
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="default">Primary</Button>
                </div>
            </Modal>
        );
    },
});

const meta: Meta = {
    title: 'Core/Modal',
    tags: ['!autodocs'],
    parameters: { layout: 'fullscreen' },
    render: () => ({
        setup() {
            const modal = createModal(SampleModal, {}, { metadata: { inline: true } });

            return () => (
                <div class="flex min-h-screen items-center justify-center bg-black/30 p-4 dark:bg-black/60">
                    <ModalComponent is={modal} />
                </div>
            );
        },
    }),
};

export const Default: Story = {};

export default meta;
