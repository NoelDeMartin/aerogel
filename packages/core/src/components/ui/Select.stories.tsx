import { useForm } from '@aerogel/core/utils/composition/forms';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { z } from 'zod';

import Form from './Form.vue';
import Select from './Select.vue';

const options = ['English', 'Spanish', 'Catalan', 'Japanese'];

type Story = StoryObj<typeof meta>;

const meta: Meta = {
    title: 'Core/Select',
};

export const Default: Story = {
    render: () => ({
        setup() {
            const form = useForm({
                language: z.string().default('English'),
            });

            return () => (
                <Form form={form} class="max-w-sm">
                    <Select name="language" label="Language" options={options} />
                </Form>
            );
        },
    }),
};

export const Error: Story = {
    render: () => ({
        setup() {
            const form = useForm({
                language: z.string().default('English'),
            });

            form.setFieldErrors('language', ['This language is not supported.']);

            return () => (
                <Form form={form} class="max-w-sm">
                    <Select name="language" label="Language" options={options} />
                </Form>
            );
        },
    }),
};

export default meta;
