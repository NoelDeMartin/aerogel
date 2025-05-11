import Aerogel from 'virtual:aerogel';

import { stringToSlug } from '@noeldemartin/utils';

export function appNamespace(): string {
    return Aerogel.namespace ?? stringToSlug(Aerogel.name);
}
