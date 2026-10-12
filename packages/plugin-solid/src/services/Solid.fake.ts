import type { AuthSession } from '@aerogel/plugin-solid/auth/Authenticator';
import FakeAuthenticator from '@aerogel/plugin-solid/auth/authenticators/FakeAuthenticator';
import type { SolidUserProfile } from '@noeldemartin/solid-utils';
import { facade, stringToSlug } from '@noeldemartin/utils';

import { SolidService } from './Solid';

export class FakeSolidService extends SolidService {
    private fakeAuthenticator = new FakeAuthenticator();

    public fakeProfile(name: string): SolidUserProfile {
        const domain = `${stringToSlug(name) || 'anonymous'}.example`;

        return {
            name: name || undefined,
            webId: `https://${domain}/profile/card#me`,
            storageUrls: [`https://${domain}/`],
            cloaked: false,
            writableProfileUrl: null,
        };
    }

    public fakeSession(profile: SolidUserProfile): AuthSession {
        return { user: profile, loginUrl: profile.webId, authenticator: this.fakeAuthenticator };
    }

    public override async logout(): Promise<void> {
        // Logging out is not supported.
    }

    protected override async boot(): Promise<void> {
        // Previous sessions are not restored.
    }

    protected override async attemptLogin(): Promise<boolean> {
        // Logging in is not supported.

        return false;
    }
}

export default facade(FakeSolidService);
