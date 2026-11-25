import { preview, setup } from '@aerogel/storybook';
import docs from '@storybook/addon-docs';
import { definePreview } from '@storybook/vue3-vite';

import app from '../src/main';

setup(app);

export default definePreview({
    ...preview,
    addons: [docs()],
    tags: ['autodocs'],
});
