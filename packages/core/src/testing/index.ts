import { isTesting } from '@noeldemartin/utils';
import type { GetClosureArgs } from '@noeldemartin/utils';

import Events from '@aerogel/core/services/Events';
import { App } from '@aerogel/core/services';
import { definePlugin } from '@aerogel/core/plugins';
import type { Services } from '@aerogel/core/services';

export interface AerogelTestingRuntime {
    on: (typeof Events)['on'];
    service<T extends keyof Services>(name: T): Services[T] | null;
}

export default definePlugin({
    async install() {
        if (!isTesting()) {
            return;
        }

        globalThis.testingRuntime = {
            on: ((...args: GetClosureArgs<(typeof Events)['on']>) => Events.on(...args)) as (typeof Events)['on'],
            service: (name) => App.service(name),
        };
    },
});

declare global {
    // eslint-disable-next-line no-var
    var testingRuntime: AerogelTestingRuntime | undefined;
}
