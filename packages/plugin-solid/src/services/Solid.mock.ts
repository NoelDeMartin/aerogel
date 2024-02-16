import { fakeDocumentUrl } from '@noeldemartin/solid-utils';
import { FakeServer, facade, mock } from '@noeldemartin/utils';
import { SolidACLAuthorization, SolidDocument, SolidEngine, SolidTypeIndex } from 'soukai-solid';

import type { AuthSession } from '@/auth/Authenticator';

import { SolidService } from './Solid';

export class SolidMockService extends SolidService {

    public readonly server: FakeServer = new FakeServer();

    constructor() {
        super();

        const engine = new SolidEngine(this.server.fetch);

        this.setState('session', {
            user: mock({ privateTypeIndexUrl: fakeDocumentUrl() }),
            authenticator: mock({
                engine,
                requireAuthenticatedFetch: () => this.server.fetch,
            }),
        } as unknown as AuthSession);

        SolidACLAuthorization.setEngine(engine);
        SolidTypeIndex.setEngine(engine);
        SolidDocument.setEngine(engine);

        this.booted.resolve();
    }

}

export default facade(SolidMockService);
