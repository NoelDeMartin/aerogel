import { bindingNotFound } from '@aerogel/plugin-routing/utils/routes';
import { findTrackedModel, getTrackedModels, loadTrackedModels } from '@aerogel/reactivity';
import { arrayFrom, isInstanceOf, silenced, stringToCamelCase } from '@noeldemartin/utils';
import { BelongsToManyRelation, Model, isLocalUrl, remote } from 'soukai-bis';
import type { ModelConstructor } from 'soukai-bis';
import type { RouteLocationNormalized } from 'vue-router';

function findModel<T extends Model>(modelClass: ModelConstructor<T>, slug: string, url: string | null): T | undefined {
    return getTrackedModels(modelClass).find((instance) => (url ? instance.url === url : instance.getSlug() === slug));
}

function findRelatedRelation<T extends Model>(
    modelClass: ModelConstructor<T>,
    parentParams: Record<string, unknown>,
): { parent: Model; relation: BelongsToManyRelation } | null {
    const parents = Object.values(parentParams).filter((param): param is Model => isInstanceOf(param, Model));

    for (const parent of parents.reverse()) {
        for (const relationName of Object.keys(parent.static().getRelations())) {
            const relation = parent.getRelation(relationName);

            if (
                relation.relatedClass !== modelClass ||
                !isInstanceOf(relation, BelongsToManyRelation) ||
                !relation.foreignKeyName ||
                relation.localKeyName !== 'url'
            ) {
                continue;
            }

            return { parent, relation };
        }
    }

    return null;
}

async function resolveRelatedModelBinding<T extends Model>(
    modelClass: ModelConstructor<T>,
    slug: string,
    url: string | null,
    parent: Model,
    relation: BelongsToManyRelation,
): Promise<T> {
    const foreignKeys = arrayFrom(parent.getAttribute(relation.foreignKeyName!), {
        ignoreEmptyValues: true,
    }).map(String);
    const matchingUrl =
        (url && foreignKeys.find((foreignUrl) => foreignUrl === url)) ||
        foreignKeys.find((foreignUrl) => modelClass.slugFromUrl(foreignUrl) === slug);

    if (!matchingUrl) {
        return bindingNotFound(slug) as unknown as T;
    }

    const model = await findTrackedModel(modelClass, matchingUrl);

    return model ?? (bindingNotFound(slug) as unknown as T);
}

export async function resolveModelBinding<T extends Model>({
    modelClass,
    bindingName,
    slug,
    route = null,
    parentParams = {},
}: {
    modelClass: ModelConstructor<T>;
    bindingName: string;
    slug: string;
    route?: RouteLocationNormalized | null;
    parentParams?: Record<string, unknown>;
}): Promise<T> {
    const paramUrlKey = `${stringToCamelCase(bindingName)}Url`;
    const url =
        (typeof route?.query?.[paramUrlKey] === 'string' ? route.query[paramUrlKey] : null) ??
        (typeof route?.query?.url === 'string' ? route.query.url : null);
    const parentRelation = findRelatedRelation(modelClass, parentParams);

    if (parentRelation) {
        return resolveRelatedModelBinding(modelClass, slug, url, parentRelation.parent, parentRelation.relation);
    }

    const trackedModel = findModel(modelClass, slug, url);

    if (trackedModel) {
        return trackedModel;
    }

    const model = await findTrackedModel(modelClass, url ?? modelClass.urlFromSlug(slug));

    if (model && (url || model.getSlug() === slug)) {
        return model;
    }

    if (url && !isLocalUrl(url)) {
        const remoteModel = await silenced(remote(modelClass).find(url));

        if (remoteModel) {
            return remoteModel;
        }

        if (modelClass.slugFromUrl(url) === slug) {
            return bindingNotFound(slug) as unknown as T;
        }
    }

    await loadTrackedModels(modelClass);

    return (
        (findModel(modelClass, slug, url && modelClass.slugFromUrl(url) === slug ? url : null) as T) ??
        bindingNotFound(slug)
    );
}
