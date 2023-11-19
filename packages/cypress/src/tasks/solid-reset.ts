import { requireEngine, setEngine } from 'soukai';
import { SolidContainer, SolidEngine, bootSolidModels } from 'soukai-solid';

import { cssPodUrl } from '../support/solid';

import { authenticate, resetAuthentication } from './solid-utils';
import { defineTask, log } from './utils';

const DEFAULT_POD_DOCUMENTS = [
    cssPodUrl('/'),
    cssPodUrl('/profile/'),
    cssPodUrl('/profile/card'),
    cssPodUrl('/README'),
];

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

async function deleteDocument(url: string): Promise<void> {
    if (DEFAULT_POD_DOCUMENTS.includes(url)) {
        return;
    }

    log(`Delete '${url}'`);

    const authenticatedFetch = requireEngine<SolidEngine>().getFetch();

    await authenticatedFetch(url, { method: 'DELETE' });
}

async function replaceDocument(url: string, body: string): Promise<void> {
    const authenticatedFetch = requireEngine<SolidEngine>().getFetch();

    await authenticatedFetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/turtle' },
        body,
    });
}

async function resetPod(retry: boolean = true): Promise<void> {
    const authenticatedFetch = await authenticate();

    bootSolidModels();
    setEngine(new SolidEngine(authenticatedFetch));

    try {
        await deleteContainer(await SolidContainer.findOrFail(cssPodUrl('/')));
        await replaceDocument(
            cssPodUrl('/profile/card'),
            `
                @prefix foaf: <http://xmlns.com/foaf/0.1/>.
                @prefix solid: <http://www.w3.org/ns/solid/terms#>.

                <> a foaf:PersonalProfileDocument;
                    foaf:maker <#me>;
                    foaf:primaryTopic <#me>.
                <#me> a foaf:Person;
                    foaf:name "Alice Cooper";
                    solid:oidcIssuer <http://localhost:4000/>.
            `,
        );
    } catch (error) {
        if (!retry) {
            throw error;
        }

        resetAuthentication();

        await resetPod(false);
    }
}

export default defineTask(async () => {
    log('Resetting POD...');

    await resetPod();

    log('POD reset complete.');
});
