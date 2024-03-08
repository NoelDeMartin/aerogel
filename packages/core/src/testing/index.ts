import type { GetClosureArgs } from '@noeldemartin/utils';

import Events from '@/services/Events';
import { definePlugin } from '@/plugins';

export interface AerogelTestingRuntime {
    on: (typeof Events)['on'];
}

export default definePlugin({
    async install() {
        if (import.meta.env.MODE !== 'testing') {
            return;
        }

        window.testingRuntime = {
            on: ((...args: GetClosureArgs<(typeof Events)['on']>) => Events.on(...args)) as (typeof Events)['on'],
        };
    },
});

declare global {
    interface Window {
        testingRuntime?: AerogelTestingRuntime;
    }
}
