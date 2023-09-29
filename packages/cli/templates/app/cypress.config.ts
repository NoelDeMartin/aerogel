import install from '@aerogel/cypress/dist/plugin';
import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:5001',
        video: false,
        setupNodeEvents(on) {
            install(on);
        },
    },
});
