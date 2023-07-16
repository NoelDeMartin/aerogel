import { defineConfig } from 'histoire';
import { HstVue } from '@histoire/plugin-vue';

export default defineConfig({
    setupFile: '/src/main.histoire.ts',
    plugins: [HstVue()],
});
