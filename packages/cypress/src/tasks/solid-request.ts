import type { GetClosureArgs } from '@noeldemartin/utils';

import { authenticate } from './solid-utils';
import { defineTask, log } from './utils';

export default defineTask(async (...args: GetClosureArgs<typeof fetch>) => {
    log(`Running request for ${args[0]}...`);

    const authenticatedFetch = await authenticate();
    const response = await authenticatedFetch(...args);

    log(`Request completed with status ${response.status}.`);

    return {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
        body: await response.text(),
    };
});
