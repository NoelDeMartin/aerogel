import { FakeServer, fakeContainerUrl, fakeDocumentUrl, mock } from '@noeldemartin/testing';
import { facade } from '@noeldemartin/utils';
import { SolidACLAuthorization, SolidDocument, SolidEngine, SolidResource, SolidTypeIndex } from 'soukai-solid';
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

        SolidACLAuthorization.setEngine(engine);
        SolidTypeIndex.setEngine(engine);
        SolidDocument.setEngine(engine);
        SolidResource.setEngine(engine);

        this.booted.resolve();
    }

}

export default facade(SolidMockService);
