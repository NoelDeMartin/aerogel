import type { LoadedRoute } from '@aerogel/plugin-routing/services/Router';
import { bindingNotFound } from '@aerogel/plugin-routing/utils/routes';
import { getTrackedModels, loadTrackedModels } from '@aerogel/plugin-solid';
import type { Model, ModelConstructor } from 'soukai-bis';
import type { LocationQueryValue } from 'vue-router';

function findModel<T extends Model>(
    modelClass: ModelConstructor<T>,
    routeUrl: LocationQueryValue | LocationQueryValue[] | undefined,
    slug: string,
): T | undefined {
    return getTrackedModels(modelClass).find(
        (instance) => (routeUrl && instance.url === routeUrl) || instance.getSlug() === slug,
    );
}

export async function resolveModelBinding<T extends Model>(
    modelClass: ModelConstructor<T>,
    slug: string,
    currentRoute: LoadedRoute | null,
): Promise<T> {
    const routeUrl = currentRoute?.query?.url;
    const model = findModel(modelClass, routeUrl, slug);

    if (model) {
        return model;
    }

    await loadTrackedModels(modelClass);

    return (findModel(modelClass, routeUrl, slug) as T) ?? bindingNotFound(slug);
}
