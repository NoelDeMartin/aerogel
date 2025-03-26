import { isTesting } from '@noeldemartin/utils';
import type { GetClosureArgs } from '@noeldemartin/utils';

import Events from '@aerogel/core/services/Events';
import { definePlugin } from '@aerogel/core/plugins';

export interface AerogelTestingRuntime {
    on: (typeof Events)['on'];
}

export default definePlugin({
    async install() {
        if (!isTesting()) {
            return;
        }

        globalThis.testingRuntime = {
            on: ((...args: GetClosureArgs<(typeof Events)['on']>) => Events.on(...args)) as (typeof Events)['on'],
        };
    },
});

declare global {
    // eslint-disable-next-line no-var
    var testingRuntime: AerogelTestingRuntime | undefined;
}
