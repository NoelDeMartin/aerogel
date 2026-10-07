import {
    ButtonSizes,
    ButtonVariants,
    type ButtonSize,
    type ButtonVariant,
} from '@aerogel/core/components/contracts/Button';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import Button from './Button.vue';

type Story = StoryObj<typeof meta>;

type StoryArgs = {
    label?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
};

const meta: Meta<StoryArgs> = {
    title: 'Button',
    component: Button,
    argTypes: {
        variant: {
            control: 'select',
            options: ButtonVariants,
        },
        size: {
            control: 'select',
            options: ButtonSizes,
        },
        disabled: { control: 'boolean' },
        loading: { control: 'boolean' },
    },
    args: {
        label: 'Click me',
        variant: 'default',
        size: 'default',
        disabled: false,
        loading: false,
    },
    render: (args) => (
        <Button variant={args.variant} size={args.size} disabled={args.disabled} loading={args.loading}>
            {args.label}
        </Button>
    ),
};

export const Showcase: Story = {
    render: (args) => {
        const states = [
            { label: 'Normal', disabled: false, loading: false },
            { label: 'Disabled', disabled: true, loading: false },
            { label: 'Loading', disabled: false, loading: true },
        ];

        return (
            <div class="flex flex-col gap-6">
                {states.map((state) => (
                    <div key={state.label} class="flex flex-col gap-2">
                        <span class="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                            {state.label}
                        </span>
                        <div class="grid grid-cols-2 items-center gap-4 sm:grid-cols-4 md:grid-cols-7">
                            {ButtonVariants.map((variant) => (
                                <Button
                                    key={variant}
                                    variant={variant}
                                    size={args.size}
                                    disabled={state.disabled || args.disabled}
                                    loading={state.loading || args.loading}
                                >
                                    {variant.charAt(0).toUpperCase() + variant.slice(1)}
                                </Button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    },
};

export const Primary: Story = {};

export default meta;
