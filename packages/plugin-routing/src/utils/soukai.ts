import { bindingNotFound } from '@aerogel/plugin-routing/utils/routes';
import { findTrackedModel, getTrackedModels, loadTrackedModels } from '@aerogel/plugin-solid';
import type { Model, ModelConstructor } from 'soukai-bis';
import type { RouteLocationNormalized } from 'vue-router';

function findModel<T extends Model>(modelClass: ModelConstructor<T>, slug: string, url: string | null): T | undefined {
    return getTrackedModels(modelClass).find(
        (instance) => (url && instance.url === url) || instance.getSlug() === slug,
    );
}

export async function resolveModelBinding<T extends Model>(
    modelClass: ModelConstructor<T>,
    slug: string,
    route: RouteLocationNormalized | null,
): Promise<T> {
    const url = typeof route?.query?.url === 'string' ? route.query.url : null;
    const trackedModel = findModel(modelClass, slug, url);

    if (trackedModel) {
        return trackedModel;
    }

    const model = await findTrackedModel(modelClass, url ?? modelClass.urlFromSlug(slug));

    if (model && (url || model.getSlug() === slug)) {
        return model;
    }

    await loadTrackedModels(modelClass);

    return (findModel(modelClass, slug, url) as T) ?? bindingNotFound(slug);
}
