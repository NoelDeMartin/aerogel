import { useForm } from '@aerogel/core/utils/composition/forms';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h } from 'vue';
import { z } from 'zod';

import Form from './Form.vue';
import Switch from './Switch.vue';

type Story = StoryObj<typeof meta>;

const meta: Meta = {
    title: 'Core/Switch',
    component: Switch,
};

export const Default: Story = {
    render: () => ({
        setup() {
            const form = useForm({
                enabled: z.boolean().default(true),
                disabled: z.boolean().default(false),
            });

            return () => (
                <Form form={form} class="flex max-w-sm flex-col gap-4">
                    {h(Switch, { name: 'enabled', label: 'Enabled' })}
                    {h(Switch, { name: 'disabled', label: 'Disabled' })}
                </Form>
            );
        },
    }),
};

export default meta;
