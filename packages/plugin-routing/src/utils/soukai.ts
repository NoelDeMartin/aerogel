import { getTrackedModels } from '@aerogel/plugin-solid';
import type { Model, ModelConstructor } from 'soukai-bis';

import { bindingNotFound } from '@aerogel/plugin-routing/utils/routes';
import type { LoadedRoute } from '@aerogel/plugin-routing/services/Router';

export function resolveModelBinding<T extends Model>(
    modelClass: ModelConstructor<T>,
    slug: string,
    currentRoute: LoadedRoute | null,
): T {
    const models = getTrackedModels(modelClass);
    const routeUrl = currentRoute?.query?.url;
    const model = models.find((instance) => (routeUrl && instance.url === routeUrl) || instance.getSlug() === slug);

    return (model as T) ?? bindingNotFound(slug);
}
