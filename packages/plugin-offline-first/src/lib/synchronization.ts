import { arrayFilter, arrayFrom, map } from '@noeldemartin/utils';
import { SolidContainer, SolidModel, Tombstone } from 'soukai-solid';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { SolidContainsRelation } from 'soukai-solid';

import { cloneLocalModel, cloneRemoteModel, getLocalModel, getRemoteModel } from '@/lib/mirroring';
import { getContainerRelations, getSameDocumentRelations } from '@/lib/inference';

async function reconcileInconsistencies(
    localModel: SolidModel,
    remoteModel: SolidModel,
    remoteOperationUrls: Record<string, string[]>,
): Promise<void> {
    localModel.rebuildAttributesFromHistory();
    localModel.setAttributes(remoteModel.getAttributes());

    getSameDocumentRelations(localModel.static()).forEach((relation) => {
        const localRelationModels = localModel.getRelationModels(relation) ?? [];
        const remoteRelationModels = map(remoteModel.getRelationModels(relation) ?? [], 'url');

        localRelationModels.forEach((localRelatedModel) => {
            if (!localRelatedModel.isRelationLoaded('operations')) {
                return;
            }

            localRelatedModel.rebuildAttributesFromHistory();
            localRelatedModel.setAttributes(remoteRelationModels.get(localRelatedModel.url)?.getAttributes() ?? {});
        });
    });

    for (const relation of getContainerRelations(localModel.static())) {
        await synchronizeContainerDocuments(
            localModel.requireRelation<SolidContainsRelation>(relation),
            remoteModel.requireRelation<SolidContainsRelation>(relation),
            remoteOperationUrls,
        );
    }

    if (localModel.isDirty()) {
        await localModel.save();
        await SolidModel.synchronize(localModel, remoteModel);
    }
}

async function synchronizeContainerDocuments(
    localRelation: SolidContainsRelation,
    remoteRelation: SolidContainsRelation,
    remoteOperationUrls: Record<string, string[]>,
): Promise<void> {
    const localModels = map(localRelation.related ?? [], 'url');
    const remoteModels = map(remoteRelation.related ?? [], 'url');
    const newLocalModelUrls = localModels
        .getKeys()
        .filter((url) => !remoteModels.hasKey(url) && !remoteModels.hasKey(encodeURI(url)));
    const newRemoteModelUrls = remoteModels
        .getKeys()
        .filter((url) => !localModels.hasKey(url) && !localModels.hasKey(encodeURI(url)));

    for (const url of newLocalModelUrls) {
        const localModel = localModels.require(url);
        const remoteModel = cloneLocalModel(localModel, remoteOperationUrls);

        remoteRelation.addRelated(remoteModel);
        remoteModels.add(remoteModel);
    }

    for (const url of newRemoteModelUrls) {
        const remoteModel = remoteModels.require(url);
        const localModel = cloneRemoteModel(remoteModel);

        localRelation.addRelated(localModel);
        localModels.add(localModel);
    }

    for (const localModel of localModels.items()) {
        const remoteModel = remoteModels.require(localModel.url);

        await SolidModel.synchronize(localModel, remoteModel);
        await saveModelAndChildren(localModel);
    }
}

export async function loadChildren(model: SolidModel): Promise<void> {
    if (!(model instanceof SolidContainer)) {
        return;
    }

    for (const relation of getContainerRelations(model.static())) {
        const children = arrayFilter(arrayFrom(await model.loadRelationIfUnloaded(relation)));

        for (const child of children) {
            await loadChildren(child as SolidModel);
        }
    }
}

export async function saveModelAndChildren(model: SolidModel): Promise<void> {
    await model.save();

    if (!(model instanceof SolidContainer)) {
        return;
    }

    const children = getContainerRelations(model.static())
        .map((relation) => model.getRelationModels(relation) ?? [])
        .flat();

    for (const child of children) {
        await saveModelAndChildren(child);
    }
}

export async function synchronizeModels(
    localModels: ObjectsMap<SolidModel>,
    remoteModels: ObjectsMap<SolidModel>,
    remoteOperationUrls: Record<string, string[]>,
): Promise<void> {
    const synchronizedModelUrls = new Set<string>();

    for (const remoteModel of remoteModels.items()) {
        if (remoteModel instanceof Tombstone) {
            const localModel = localModels.get(remoteModel.resourceUrl);

            if (localModel) {
                await localModel.delete();

                synchronizedModelUrls.add(remoteModel.resourceUrl);
            }

            continue;
        }

        const localModel = getLocalModel(remoteModel, localModels);

        await loadChildren(localModel);
        await SolidModel.synchronize(localModel, remoteModel);
        await reconcileInconsistencies(localModel, remoteModel, remoteOperationUrls);
        await saveModelAndChildren(localModel);

        localModels.add(localModel);
        synchronizedModelUrls.add(localModel.url);
    }

    for (const [url, localModel] of localModels) {
        if (synchronizedModelUrls.has(url)) {
            continue;
        }

        await loadChildren(localModel);

        const remoteModel = getRemoteModel(localModel, remoteModels, remoteOperationUrls);

        await SolidModel.synchronize(localModel, remoteModel);

        remoteModels.add(remoteModel);
    }
}
