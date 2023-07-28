import { defineConfig } from 'histoire';
import { HstVue } from '@histoire/plugin-vue';

export default defineConfig({
    setupFile: '/src/main.histoire.ts',
    plugins: [HstVue()],
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
