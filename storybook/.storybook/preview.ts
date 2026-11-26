import { decorators, preview, setup } from '@aerogel/storybook';
import docs from '@storybook/addon-docs';
import { definePreview } from '@storybook/vue3-vite';

import app from '../src/main';

setup(app);

const primaryColors: Record<string, string> = {
    blue: 'oklch(62.3% 0.214 259.815)',
    indigo: 'oklch(51.1% 0.262 276.966)',
    emerald: 'oklch(59.6% 0.145 163.225)',
    rose: 'oklch(58.6% 0.253 17.585)',
    amber: 'oklch(66.6% 0.179 58.318)',
};

export default definePreview({
    ...preview,
    decorators: [
        ...decorators,
        (story, { globals }) => {
            const color = primaryColors[globals.primaryColor];

            if (color) {
                document.documentElement.style.setProperty('--color-primary', color);
            } else {
                document.documentElement.style.removeProperty('--color-primary');
            }

            return story();
        },
    ],
    globalTypes: {
        ...preview.globalTypes,
        primaryColor: {
            description: 'Primary color',
            toolbar: {
                icon: 'paintbrush',
                dynamicTitle: true,
                items: [
                    { value: 'default', title: 'Default primary' },
                    { value: 'blue', title: 'Blue' },
                    { value: 'indigo', title: 'Indigo' },
                    { value: 'emerald', title: 'Emerald' },
                    { value: 'rose', title: 'Rose' },
                    { value: 'amber', title: 'Amber' },
                ],
            },
        },
    },
    initialGlobals: {
        ...preview.initialGlobals,
        primaryColor: 'default',
    },
    addons: [docs()],
    tags: ['autodocs'],
});
