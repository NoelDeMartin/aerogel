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
                title: 'Others',
                include: () => true,
            },
        ],
    },
});
