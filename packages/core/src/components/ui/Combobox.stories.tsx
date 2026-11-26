import { useForm } from '@aerogel/core/utils/composition/forms';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { z } from 'zod';

import Combobox from './Combobox.vue';
import Form from './Form.vue';

const options = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Sci-Fi'];

type Story = StoryObj<typeof meta>;

const meta: Meta = {
    title: 'Core/Combobox',
};

export const Single: Story = {
    render: () => ({
        setup() {
            const form = useForm({
                genre: z.string().default('Fantasy'),
            });

            return () => (
                <Form form={form} class="max-w-sm">
                    <Combobox name="genre" label="Genre" options={options} placeholder="Pick a genre..." />
                </Form>
            );
        },
    }),
};

export const Multiple: Story = {
    render: () => ({
        setup() {
            const form = useForm({
                genres: z.array(z.string()).default(['Fantasy', 'Sci-Fi']),
            });

            return () => (
                <Form form={form} class="max-w-sm">
                    <Combobox name="genres" label="Genres" options={options} multiple placeholder="Add genres..." />
                </Form>
            );
        },
    }),
};

export const Error: Story = {
    render: () => ({
        setup() {
            const form = useForm({
                single: z.string().default('Invalid genre'),
                multiple: z.array(z.string()).default(['Fantasy', 'Sci-Fi']),
            });

            form.setFieldErrors('single', ['Please select a valid genre.']);
            form.setFieldErrors('multiple', ['Select at least 3 genres.']);

            return () => (
                <Form form={form} class="flex max-w-sm flex-col gap-6">
                    <Combobox name="single" label="Single (error)" options={options} placeholder="Pick a genre..." />
                    <Combobox
                        name="multiple"
                        label="Multiple (error)"
                        options={options}
                        multiple
                        placeholder="Add genres..."
                    />
                </Form>
            );
        },
    }),
};

export default meta;
