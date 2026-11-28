import type { CloudRegistration, RegisterOptions } from '@aerogel/plugin-local-first/services/Cloud';
import type { ModelConstructor } from 'soukai-bis';

export function cloudRegistration(options: RegisterOptions): RegisterOptions {
    return options;
}

export function getCloudRegistration(modelClass: ModelConstructor): CloudRegistration {
    return Object.hasOwn(modelClass, 'cloud') ? modelClass.cloud : undefined;
}
