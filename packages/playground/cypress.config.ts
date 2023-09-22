import { defineConfig } from 'cypress';

import tasks from './cypress/tasks';

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
            on('task', tasks);
        },
    },
});
