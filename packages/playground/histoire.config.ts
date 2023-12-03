import HstAerogel from '@aerogel/histoire/dist/plugin';
import { defineConfig } from 'histoire';

export default defineConfig({
    setupFile: '/src/main.histoire.ts',
    plugins: [HstAerogel()],
    tree: {
        groups: [
            {
                id: 'base',
                title: 'Base',
            },
            {
                id: 'modals',
                title: 'Modals',
            },
            {
                title: 'Others',
                include: () => true,
            },
        ],
    },
});
