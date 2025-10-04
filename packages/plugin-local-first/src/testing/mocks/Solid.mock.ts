import { FakeServer, fakeContainerUrl, fakeDocumentUrl, mock } from '@noeldemartin/testing';
import { facade } from '@noeldemartin/utils';
import {
    SolidACLAuthorization,
    SolidDocument,
    SolidEngine,
    SolidResource,
    SolidTypeIndex,
    coreModels,
} from 'soukai-solid';
import { SolidService } from '@aerogel/plugin-solid';
import type { AuthSession } from '@aerogel/plugin-solid';

export class SolidMockService extends SolidService {

    constructor() {
        super();

        const engine = new SolidEngine(FakeServer.fetch);

        this.setState('session', {
            user: mock({
                privateTypeIndexUrl: fakeDocumentUrl(),
                storageUrls: [fakeContainerUrl()],
            }),
            authenticator: mock({
                engine,
                requireAuthenticatedFetch: () => FakeServer.fetch,
            }),
        } as unknown as AuthSession);

        coreModels.forEach((model) => model.setEngine(engine));

        this.booted.resolve();
    }

}

export default facade(SolidMockService);
