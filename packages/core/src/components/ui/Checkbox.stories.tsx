import { useForm } from '@aerogel/core/utils/composition/forms';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { z } from 'zod';

import Checkbox from './Checkbox.vue';
import Form from './Form.vue';

type Story = StoryObj<typeof meta>;

const meta: Meta = {
    title: 'Core/Checkbox',
    component: Checkbox,
};

export const Default: Story = {
    render: () => ({
        setup() {
            const form = useForm({
                checked: z.boolean().default(true),
                unchecked: z.boolean().default(false),
            });

            return () => (
                <Form form={form} class="flex max-w-sm flex-col gap-3">
                    <Checkbox name="checked" label="Checked option" />
                    <Checkbox name="unchecked" label="Unchecked option" />
                </Form>
            );
        },
    }),
};

export const Error: Story = {
    render: () => ({
        setup() {
            const form = useForm({
                terms: z.boolean().default(false),
            });

            form.setFieldErrors('terms', ['You must accept the terms to continue.']);

            return () => (
                <Form form={form} class="max-w-sm">
                    <Checkbox name="terms" label="I accept the terms and conditions" />
                </Form>
            );
        },
    }),
};

export default meta;
