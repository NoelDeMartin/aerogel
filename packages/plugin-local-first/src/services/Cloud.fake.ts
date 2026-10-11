import { facade } from '@noeldemartin/utils';

import { CloudService } from './Cloud';

/**
 * Cloud service that doesn't touch any data, useful in testing environments such as Storybook.
 */
export class FakeCloudService extends CloudService {
    public override async setup(): Promise<void> {
        // Setting up the cloud is not supported.
    }

    public override async sync(): Promise<void> {
        // Synchronizing is not supported.
    }

    protected override async boot(): Promise<void> {
        // Models are not tracked, and nothing is synchronized on startup.
    }
}

export default facade(FakeCloudService);
