import InruptAuthenticator from './authenticators/InruptAuthenticator';
import LegacyAuthenticator from './authenticators/LegacyAuthenticator';
import UVDSLAuthenticator from './authenticators/UVDSLAuthenticator';
import type Authenticator from './Authenticator';

const _authenticators = {} as Authenticators;

type BaseAuthenticators = typeof authenticators;

export * from './Authenticator';
export { default as Authenticator } from './Authenticator';

export const authenticators = {
    inrupt: new InruptAuthenticator(),
    legacy: new LegacyAuthenticator(),
    uvdsl: new UVDSLAuthenticator(),
};

export function setDefaultAuthenticator(authenticator: Authenticator): void {
    _authenticators.default = authenticator;
}

export function getAuthenticator<T extends AuthenticatorName>(name: T): Authenticators[T] {
    return _authenticators[name];
}

export function registerAuthenticators(customAuthenticators: Record<string, Authenticator>): void {
    Object.entries(customAuthenticators).forEach(([name, authenticator]) =>
        registerAuthenticator(name as AuthenticatorName, authenticator));
}

export function registerAuthenticator<T extends AuthenticatorName>(name: T, authenticator: Authenticators[T]): void {
    _authenticators[name] = authenticator;

    authenticator.name = authenticator.name ?? name;
}

export type AuthenticatorName = keyof Authenticators;

export interface Authenticators extends BaseAuthenticators {
    default: Authenticator;
}
