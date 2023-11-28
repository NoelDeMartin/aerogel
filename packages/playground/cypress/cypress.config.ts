import install from '@aerogel/cypress/dist/plugin';
import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:5001',
        video: false,
        chromeWebSecurity: false,
        retries: {
            runMode: 3,
            openMode: 0,
        },
        setupNodeEvents(on) {
            install(on);
        },
    },
});
