import Authenticator, { type AuthSession } from '@aerogel/plugin-solid/auth/Authenticator';

export default class FakeAuthenticator extends Authenticator {
    public async login(): Promise<AuthSession> {
        throw new Error('Fake authenticator cannot log in');
    }

    public async logout(): Promise<void> {
        // Nothing to do here.
    }

    protected async restoreSession(): Promise<void> {
        // Nothing to do here.
    }
}
