import { stringToSlug } from '@noeldemartin/utils';
import Aerogel from 'virtual:aerogel';

export function appNamespace(): string {
    return Aerogel.namespace ?? stringToSlug(Aerogel.name);
}
