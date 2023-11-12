import type { GetClosureArgs } from '@noeldemartin/utils';

import { authenticate } from './solid-utils';
import { defineTask, log } from './utils';

export default defineTask(async (...args: GetClosureArgs<typeof fetch>) => {
    log(`${args[1]?.['method'] ?? 'GET'} ${args[0]}...`);

    const authenticatedFetch = await authenticate();
    const response = await authenticatedFetch(...args);

    log(`Response: ${response.status}`);

    return {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
        body: await response.text(),
    };
});
