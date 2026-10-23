import { facade } from '@noeldemartin/utils';
import { getBootedModels, isCoreModel } from 'soukai-bis';

import { CloudService } from './Cloud';

export class FakeCloudService extends CloudService {
    public override async setup(): Promise<void> {
        // Setting up the cloud is not supported.
    }

    public override async sync(): Promise<void> {
        // Synchronizing is not supported.
    }

    protected override async boot(): Promise<void> {
        for (const modelClass of getBootedModels().values()) {
            if (isCoreModel(modelClass) || !modelClass.cloud) {
                continue;
            }

            await this.initializeTrackedModels(modelClass, modelClass.cloud);
        }
    }
}

export default facade(FakeCloudService);
