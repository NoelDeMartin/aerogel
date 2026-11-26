import { useForm } from '@aerogel/core/utils/composition/forms';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h, watch } from 'vue';
import { z } from 'zod';

import Form from './Form.vue';
import TextArea from './TextArea.vue';

type Story = StoryObj<typeof meta>;

type StoryArgs = {
    label: string;
    description: string;
    placeholder: string;
    value: string;
    error: string;
};

const meta: Meta<StoryArgs> = {
    title: 'Core/TextArea',
    component: TextArea,
    args: {
        label: 'Bio',
        description: 'Write a few sentences about yourself.',
        placeholder: 'Tell us about yourself...',
        value: '',
        error: '',
    },
    render: (args) => ({
        setup() {
            const form = useForm({
                bio: z.string().default(args.value),
            });

            watch(
                () => args.value,
                (value) => form.setFieldValue('bio', value),
            );
            watch(
                () => args.error,
                (error) => form.setFieldErrors('bio', error ? [error] : null),
                { immediate: true },
            );

            return () => (
                <Form form={form} class="max-w-sm">
                    {h(TextArea, {
                        name: 'bio',
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
                filled: z.string().default('Too short'),
                empty: z.string().default(''),
            });

            form.setFieldErrors('filled', ['Bio must be at least 20 characters.']);
            form.setFieldErrors('empty', ['This field is required.']);

            return () => (
                <Form form={form} class="flex max-w-sm flex-col gap-6">
                    {h(TextArea, {
                        name: 'filled',
                        label: 'Bio (with value)',
                        placeholder: 'Tell us about yourself...',
                    })}
                    {h(TextArea, {
                        name: 'empty',
                        label: 'Bio (placeholder)',
                        placeholder: 'Tell us about yourself...',
                    })}
                </Form>
            );
        },
    }),
};

export default meta;
