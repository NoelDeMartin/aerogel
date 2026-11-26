import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ToastProvider, ToastViewport } from 'reka-ui';

import Toast from './Toast.vue';

type Story = StoryObj<typeof meta>;

const meta: Meta = {
    title: 'Core/Toast',
    component: Toast,
};

export const Showcase: Story = {
    render: () => ({
        setup() {
            return () => (
                <ToastProvider duration={Infinity}>
                    <Toast
                        variant="secondary"
                        message="Changes saved to your library."
                        actions={[{ label: 'Undo', click: () => {} }]}
                    />
                    <Toast
                        variant="warning"
                        message="You are currently offline."
                        actions={[{ label: 'Retry', click: () => {} }]}
                    />
                    <Toast
                        variant="danger"
                        message="Could not synchronize your changes."
                        actions={[{ label: 'Details', click: () => {} }]}
                    />
                    <ToastViewport class="flex max-w-md flex-col items-start gap-3" />
                </ToastProvider>
            );
        },
    }),
};

export default meta;
