import type { ObjectsMap } from '@noeldemartin/utils';
import type { SolidModel } from 'soukai-solid';

import { getRelatedAppModels, loadAppRelations } from '@aerogel/plugin-local-first/lib/inference';

export default class TracksLocalModels {

    declare protected localModels: ObjectsMap<SolidModel>;

    protected async indexLocalModels(models: SolidModel[]): Promise<void> {
        for (const localModel of models) {
            await this.addLocalModel(localModel);
        }
    }

    protected async addLocalModel(localModel: SolidModel): Promise<void> {
        if (this.localModels.hasKey(localModel.url)) {
            return;
        }

        this.localModels.add(localModel);

        await loadAppRelations(localModel);

        for (const relatedModel of getRelatedAppModels(localModel)) {
            await this.addLocalModel(relatedModel);
        }
    }

}
