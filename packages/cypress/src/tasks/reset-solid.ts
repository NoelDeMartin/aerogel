import { buildAuthenticatedFetch, createDpopHeader, generateDpopKeyPair } from '@inrupt/solid-client-authn-core';
import { fail, isObject, objectWithoutEmpty } from '@noeldemartin/utils';
import { requireEngine, setEngine } from 'soukai';
import { SolidContainer, SolidEngine, bootSolidModels } from 'soukai-solid';

import { cssPodUrl } from '../support/solid';

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

const DEFAULT_POD_DOCUMENTS = [
    cssPodUrl('/alice/'),
    cssPodUrl('/alice/profile/'),
    cssPodUrl('/alice/profile/card'),
    cssPodUrl('/alice/README'),
];

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

function log(...messages: [string, ...unknown[]]): void {
    const [firstMessage, ...otherMessages] = messages;

    // eslint-disable-next-line no-console
    console.log(`[CommunitySolidServer]: ${firstMessage}`, ...otherMessages);
}

async function deleteContainer(container: SolidContainer): Promise<void> {
    await Promise.all(
        (container.resourceUrls as string[]).map(async (url) => {
            if (url.endsWith('/')) {
                const childContainer = await SolidContainer.findOrFail(url);

                await deleteContainer(childContainer);

                return;
            }

            await deleteDocument(url);
        }),
    );

    await deleteDocument(container.url);
}

async function getCredentials(authorization: string): Promise<{ id: string; secret: string }> {
    const url = await controlUrl('account.clientCredentials', authorization);
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `CSS-Account-Token ${authorization}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webId: cssPodUrl('/alice/profile/card#me') }),
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

async function deleteDocument(url: string): Promise<void> {
    if (DEFAULT_POD_DOCUMENTS.includes(url)) {
        return;
    }

    log(`Delete '${url}'`);

    const authenticatedFetch = requireEngine<SolidEngine>().getFetch();

    await authenticatedFetch(url, { method: 'DELETE' });
}

async function controlUrl(key: string, authorization?: string): Promise<string> {
    const response = await fetch(cssPodUrl('/.account/'), {
        headers: objectWithoutEmpty({
            Authorization: authorization && `CSS-Account-Token ${authorization}`,
        }),
    });
    const json = (await response.json()) as CSSResponse;
    const url = key.split('.').reduce((controls, part) => controls[part], json.controls);

    return typeof url === 'string' ? url : fail(`'${key}' CSS control not found`);
}

async function authenticate(authorization: string): Promise<typeof fetch> {
    const credentials = await getCredentials(authorization);
    const authString = `${encodeURIComponent(credentials.id)}:${encodeURIComponent(credentials.secret)}`;
    const tokenUrl = cssPodUrl('/.oidc/token');
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

    return buildAuthenticatedFetch(fetch, json.access_token, { dpopKey });
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

async function setupAccount(): Promise<void> {
    const authorization = await createAccount();

    await createPassword(authorization);
    await createPOD(authorization);
}

async function resetPOD(authorization: string): Promise<void> {
    log('Getting authenticated fetch');
    const authenticatedFetch = await authenticate(authorization);

    log('Got auth fetch');

    bootSolidModels();
    setEngine(new SolidEngine(authenticatedFetch));

    const root = await SolidContainer.findOrFail(cssPodUrl('/alice/'));

    await deleteContainer(root);
}

async function main(): Promise<void> {
    try {
        log('Logging in...');
        const authorization = await logIn();

        if (!authorization) {
            log('Account missing, creating it...');
            await setupAccount();
            log('Account created.');
            return;
        }

        log('Deleting documents...');
        await resetPOD(authorization);
        log('POD reset complete.');
    } catch (error) {
        log('Something went wrong', isObject(error) ? error.message || error : error);
    }
}

export default async function(): Promise<null> {
    await main();

    return null;
}
