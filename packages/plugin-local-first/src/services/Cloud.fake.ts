import { getCloudRegistration } from '@aerogel/plugin-local-first/utils/cloud';
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
            const registration = getCloudRegistration(modelClass);

            if (isCoreModel(modelClass) || !registration) {
                continue;
            }

            this.initializeTrackedModels(modelClass, registration);
        }
    }
}

export default facade(FakeCloudService);
