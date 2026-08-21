import type z from 'zod';
import type { App } from 'vue';

import type { Plugin } from '@aerogel/core/plugins';

export interface AerogelOptions {
    env?: z.ZodObject;
    plugins?: Plugin[];
    install?(app: App): void | Promise<void>;
}
