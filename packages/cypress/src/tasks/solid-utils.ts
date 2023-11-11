import { buildAuthenticatedFetch, createDpopHeader, generateDpopKeyPair } from '@inrupt/solid-client-authn-core';
import { fail, objectWithoutEmpty } from '@noeldemartin/utils';

import { cssPodWebId, cssUrl } from '../support/solid';

import { log } from './utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CSSControls = any;

interface CSSResponse {
    controls: CSSControls;
}

interface CSSAuthorizedResponse extends CSSResponse {
    authorization: string;
}

interface CSSCredentialsResponse extends CSSResponse {
    id: string;
    secret: string;
}

let authenticatedFetch: typeof fetch | null = null;

function isUnsuccessfulResponse(response: unknown, message?: string): response is { message?: string; name?: string } {
    return (
        typeof response === 'object' &&
        response !== null &&
        'statusCode' in response &&
        'message' in response &&
        Number(response.statusCode) % 100 !== 2 &&
        (!message || response.message === message)
    );
}

async function getCredentials(authorization: string): Promise<{ id: string; secret: string }> {
    const url = await controlUrl('account.clientCredentials', authorization);
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `CSS-Account-Token ${authorization}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webId: cssPodWebId() }),
    });
    const json = (await response.json()) as CSSCredentialsResponse;

    if (isUnsuccessfulResponse(json)) {
        throw new Error(json.message || json.name);
    }

    return {
        id: json.id,
        secret: json.secret,
    };
}

async function controlUrl(key: string, authorization?: string): Promise<string> {
    const response = await fetch(cssUrl('/.account/'), {
        headers: objectWithoutEmpty({
            Authorization: authorization && `CSS-Account-Token ${authorization}`,
        }),
    });
    const json = (await response.json()) as CSSResponse;
    const url = key.split('.').reduce((controls, part) => controls[part], json.controls);

    return typeof url === 'string' ? url : fail(`'${key}' CSS control not found`);
}

export async function authenticate(): Promise<typeof fetch> {
    if (!authenticatedFetch) {
        log('Logging in...');
        const authorization = (await logIn()) ?? (await setupAccount());

        log('Getting authenticated fetch');
        const credentials = await getCredentials(authorization);
        const authString = `${encodeURIComponent(credentials.id)}:${encodeURIComponent(credentials.secret)}`;
        const tokenUrl = cssUrl('/.oidc/token');
        const dpopKey = await generateDpopKeyPair();
        const dpop = await createDpopHeader(tokenUrl, 'POST', dpopKey);
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(authString).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'DPoP': dpop,
            },
            body: 'grant_type=client_credentials&scope=webid',
        });
        const json = (await response.json()) as { access_token: string };

        if (isUnsuccessfulResponse(json)) {
            throw new Error(json.message || json.name);
        }

        authenticatedFetch = await buildAuthenticatedFetch(fetch, json.access_token, { dpopKey });
    }

    return authenticatedFetch;
}

async function logIn(): Promise<string | null> {
    const url = await controlUrl('password.login');
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'alice@example.com',
            password: 'secret',
        }),
    });
    const json = (await response.json()) as CSSAuthorizedResponse;

    if (isUnsuccessfulResponse(json, 'Invalid email/password combination.')) {
        return null;
    }

    return json.authorization;
}

async function createAccount(): Promise<string> {
    const url = await controlUrl('account.create');
    const response = await fetch(url, { method: 'POST' });
    const json = (await response.json()) as CSSAuthorizedResponse;

    if (isUnsuccessfulResponse(json)) {
        throw new Error(json.message || json.name);
    }

    return json.authorization;
}

async function createPassword(authorization: string): Promise<void> {
    const url = await controlUrl('password.create', authorization);
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `CSS-Account-Token ${authorization}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: 'alice@example.com',
            password: 'secret',
        }),
    });
    const json = await response.json();

    if (isUnsuccessfulResponse(json)) {
        throw new Error(json.message || json.name);
    }
}

async function createPOD(authorization: string): Promise<void> {
    const url = await controlUrl('account.pod', authorization);
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `CSS-Account-Token ${authorization}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: 'alice',
        }),
    });
    const json = await response.json();

    if (isUnsuccessfulResponse(json)) {
        throw new Error(json.message || json.name);
    }
}

async function setupAccount(): Promise<string> {
    log('Account missing, creating it...');
    const authorization = await createAccount();

    await createPassword(authorization);
    await createPOD(authorization);

    return authorization;
}
