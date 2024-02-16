import { fakeDocumentUrl } from '@noeldemartin/solid-utils';
import { FakeServer, facade, mock, tap } from '@noeldemartin/utils';
import { SolidACLAuthorization, SolidDocument, SolidEngine, SolidTypeIndex } from 'soukai-solid';
import type { Attributes } from 'soukai';

import type { AuthSession } from '@/auth/Authenticator';

import { SolidService } from './Solid';

export class SolidMockService extends SolidService {

    public readonly server: FakeServer = new FakeServer();
    private privateTypeIndex: SolidTypeIndex | null = null;

    public init(): void {
        const engine = new SolidEngine(this.server.fetch);

        this.setState('session', {
            user: mock(),
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

    public setPrivateTypeIndex(registrations: Attributes[]): SolidTypeIndex {
        return (this.privateTypeIndex = tap(new SolidTypeIndex({ url: fakeDocumentUrl() }), (typeIndex) =>
            registrations.forEach((registration) => typeIndex.relatedRegistrations.attach(registration))));
    }

    public findPrivateTypeIndex(): Promise<SolidTypeIndex | null> {
        return Promise.resolve(this.privateTypeIndex);
    }

}

export default facade(SolidMockService);
