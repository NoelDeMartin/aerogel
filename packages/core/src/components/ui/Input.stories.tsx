import { useForm } from '@aerogel/core/utils/composition/forms';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h, watch } from 'vue';
import { z } from 'zod';

import Form from './Form.vue';
import Input from './Input.vue';

type Story = StoryObj<typeof meta>;

type StoryArgs = {
    label: string;
    description: string;
    placeholder: string;
    value: string;
    error: string;
};

const meta: Meta<StoryArgs> = {
    title: 'Core/Input',
    component: Input,
    args: {
        label: 'Email',
        description: 'We will only use this for account notifications.',
        placeholder: 'alice@example.com',
        value: '',
        error: '',
    },
    render: (args) => ({
        setup() {
            const form = useForm({
                email: z.string().default(args.value),
            });

            watch(
                () => args.value,
                (value) => form.setFieldValue('email', value),
            );
            watch(
                () => args.error,
                (error) => form.setFieldErrors('email', error ? [error] : null),
                { immediate: true },
            );

            return () => (
                <Form form={form} class="max-w-sm">
                    {h(Input, {
                        name: 'email',
                        label: args.label,
                        description: args.description,
                        placeholder: args.placeholder,
                    })}
                </Form>
            );
        },
    }),
};

export const Default: Story = {};

export const Error: Story = {
    render: () => ({
        setup() {
            const form = useForm({
                filled: z.string().default('not-an-email'),
                empty: z.string().default(''),
            });

            form.setFieldErrors('filled', ['Please enter a valid email address.']);
            form.setFieldErrors('empty', ['This field is required.']);

            return () => (
                <Form form={form} class="flex max-w-sm flex-col gap-6">
                    {h(Input, { name: 'filled', label: 'Email (with value)', placeholder: 'alice@example.com' })}
                    {h(Input, { name: 'empty', label: 'Email (placeholder)', placeholder: 'alice@example.com' })}
                </Form>
            );
        },
    }),
};

export default meta;
