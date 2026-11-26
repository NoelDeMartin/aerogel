import { numberRange } from '@aerogel/core/forms/schemas';
import { useForm } from '@aerogel/core/utils/composition/forms';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import Form from './Form.vue';
import RangeSlider from './RangeSlider.vue';

type Story = StoryObj<typeof meta>;

const meta: Meta = {
    title: 'Core/RangeSlider',
    component: RangeSlider,
};

export const Default: Story = {
    render: () => ({
        setup() {
            const form = useForm({
                range: numberRange().default([20, 80]),
            });

            return () => (
                <Form form={form} class="max-w-sm">
                    <RangeSlider name="range" label="Rating range" description="Filter items within this range." />
                </Form>
            );
        },
    }),
};

export const Error: Story = {
    render: () => ({
        setup() {
            const form = useForm({
                range: numberRange().default([20, 80]),
            });

            form.setFieldErrors('range', ['Selected range is invalid.']);

            return () => (
                <Form form={form} class="max-w-sm">
                    <RangeSlider name="range" label="Rating range" />
                </Form>
            );
        },
    }),
};

export default meta;
