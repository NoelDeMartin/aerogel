import type { ObjectsMap } from '@noeldemartin/utils';
import type { SolidModel } from 'soukai-solid';

import { getContainerRelations } from '@/lib/inference';

export default class TracksLocalModels {

    protected declare localModels?: ObjectsMap<SolidModel>;

    protected async indexLocalModels(models: SolidModel[]): Promise<void> {
        for (const localModel of models) {
            await this.addLocalModel(localModel);
        }
    }

    protected async addLocalModel(localModel: SolidModel): Promise<void> {
        if (!this.localModels || this.localModels.hasKey(localModel.url)) {
            return;
        }

        this.localModels.add(localModel);

        for (const relation of getContainerRelations(localModel.static())) {
            await localModel.loadRelationIfUnloaded(relation);
        }

        for (const relatedModel of localModel.getRelatedModels()) {
            await this.addLocalModel(relatedModel);
        }
    }

}
