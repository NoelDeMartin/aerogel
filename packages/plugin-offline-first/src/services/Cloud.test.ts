import { beforeEach, describe, expect, it } from 'vitest';
import { App, Events } from '@aerogel/core';
import { fakeContainerUrl, fakeDocumentUrl } from '@noeldemartin/testing';
import { FakeResponse, arrayFind, mock } from '@noeldemartin/utils';
import { InMemoryEngine, bootModels, resetModelListeners, setEngine } from 'soukai';
import { resetTrackedModels } from '@aerogel/plugin-soukai';
import { Solid } from '@aerogel/plugin-solid';
import { SolidTypeRegistration, bootSolidModels } from 'soukai-solid';
import type { App as AppInstance } from 'vue';

import Movie from '@/testing/stubs/Movie';
import MoviesContainer from '@/testing/stubs/MoviesContainer';
import SolidMock from '@/testing/mocks/Solid.mock';
import Task from '@/testing/stubs/Task';
import TasksList from '@/testing/stubs/TasksList';
import Workspace from '@/testing/stubs/Workspace';

import Cloud from './Cloud';

describe('Cloud', () => {

    beforeEach(() => {
        bootSolidModels();
        bootModels({ Movie, MoviesContainer, Task, TasksList, Workspace });
        setEngine(new InMemoryEngine());
        resetTrackedModels();
        resetModelListeners();

        App.instance = mock<AppInstance>({ config: { globalProperties: { $cloud: Cloud } } });

        Solid.mock();
        Cloud.reset();
    });

    it('Syncs containers', async () => {
        // Arrange - Mint urls
        const parentContainerUrl = SolidMock.requireUser().storageUrls[0];
        const remoteContainerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const localContainerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });

        // Arrange - Prepare models
        await MoviesContainer.at(parentContainerUrl).create({
            url: localContainerUrl,
            name: 'Local Movies',
        });

        // Arrange - Prepare responses
        const server = SolidMock.server;
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';

        server.respond(typeIndexUrl, typeIndexResponse(remoteContainerUrl));
        server.respond(remoteContainerUrl, containerResponse({ name: 'Remote Movies' }));
        server.respondOnce(localContainerUrl, FakeResponse.notFound()); // Tombstone check
        server.respondOnce(localContainerUrl, FakeResponse.notFound()); // Check before create
        server.respondOnce(localContainerUrl, FakeResponse.created()); // Create
        server.respondOnce(
            // Read described-by header
            localContainerUrl,
            FakeResponse.success('<> a <http://www.w3.org/ns/ldp#Container> .'),
        );
        server.respondOnce(`${localContainerUrl}.meta`, FakeResponse.success()); // Update meta

        // Arrange - Prepare service
        await Cloud.launch();
        await Cloud.register(MoviesContainer);
        await Events.emit('application-ready');

        // Act
        await Cloud.sync();

        // Assert
        expect(server.getRequests(typeIndexUrl)).toHaveLength(3);
        expect(server.getRequests(remoteContainerUrl)).toHaveLength(1);
        expect(server.getRequests(localContainerUrl)).toHaveLength(4);
        expect(server.getRequests(localContainerUrl + '.meta')).toHaveLength(1);
        expect(server.getRequests()).toHaveLength(9);
        expect(server.getRequest('PATCH', typeIndexUrl)?.body).toEqualSparql(`
            INSERT DATA {
                <#[[.*]]>
                    a <http://www.w3.org/ns/solid/terms#TypeRegistration> ;
                    <http://www.w3.org/ns/solid/terms#forClass> <https://schema.org/Movie> ;
                    <http://www.w3.org/ns/solid/terms#instanceContainer> <${localContainerUrl}> .
            }
        `);

        const typeIndex = await Solid.findPrivateTypeIndex();
        const findRegistration = (url: string) => arrayFind(typeIndex?.registrations ?? [], 'instanceContainer', url);
        expect(typeIndex).not.toBeNull();
        expect(typeIndex?.registrations).toHaveLength(2);
        expect(findRegistration(remoteContainerUrl)).toBeInstanceOf(SolidTypeRegistration);
        expect(findRegistration(localContainerUrl)).toBeInstanceOf(SolidTypeRegistration);

        const containers = await MoviesContainer.all();
        expect(containers).toHaveLength(2);
        expect(arrayFind(containers, 'name', 'Local Movies')).toBeInstanceOf(MoviesContainer);
        expect(arrayFind(containers, 'name', 'Remote Movies')).toBeInstanceOf(MoviesContainer);
    });

    it('Syncs container documents', async () => {
        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0];
        const containerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const localDocumentUrl = fakeDocumentUrl({ containerUrl });
        const remoteDocumentUrl = fakeDocumentUrl({ containerUrl });

        // Arrange - Prepare models
        const container = await MoviesContainer.at(parentContainerUrl).create({
            url: containerUrl,
            name: 'Remote Movies',
        });

        await container.relatedMovies.create({ url: `${localDocumentUrl}#it`, name: 'The Tale of Princess Kaguya' });

        // Arrange - Prepare responses
        const server = SolidMock.server;
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';

        server.respond(typeIndexUrl, typeIndexResponse(containerUrl));
        server.respond(
            containerUrl,
            containerResponse({
                name: 'Remote Movies',
                documentUrls: [remoteDocumentUrl],
                createdAt: container.createdAt,
                updatedAt: container.updatedAt,
            }),
        );
        server.respond(remoteDocumentUrl, movieResponse('Spirited Away'));
        server.respondOnce(localDocumentUrl, FakeResponse.notFound()); // Check before create
        server.respondOnce(localDocumentUrl, FakeResponse.created()); // Create

        // Arrange - Prepare service
        await Cloud.launch();
        await Cloud.register(MoviesContainer);
        await Events.emit('application-ready');

        // Act
        await Cloud.sync();

        // Assert
        expect(server.getRequests(typeIndexUrl)).toHaveLength(1);
        expect(server.getRequests(containerUrl)).toHaveLength(1);
        expect(server.getRequests(localDocumentUrl)).toHaveLength(2);
        expect(server.getRequests(remoteDocumentUrl)).toHaveLength(1);
        expect(server.getRequests()).toHaveLength(5);

        const movies = await Movie.from(containerUrl).all();
        expect(movies).toHaveLength(2);
        expect(arrayFind(movies, 'name', 'The Tale of Princess Kaguya')).toBeInstanceOf(Movie);
        expect(arrayFind(movies, 'name', 'Spirited Away')).toBeInstanceOf(Movie);
    });

    it('Syncs documents', async () => {
        // Arrange - Mint urls
        const containerUrl = Solid.requireUser().storageUrls[0];
        const remoteDocumentUrl = fakeDocumentUrl({ containerUrl });
        const localDocumentUrl = fakeDocumentUrl({ containerUrl });

        // Arrange - Prepare models
        await Movie.at(containerUrl).create({
            url: `${localDocumentUrl}#it`,
            name: 'The Tale of Princess Kaguya',
        });

        // Arrange - Prepare responses
        const server = SolidMock.server;
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';

        server.respond(typeIndexUrl, typeIndexResponse(containerUrl));
        server.respond(containerUrl, containerResponse({ name: 'Movies', documentUrls: [remoteDocumentUrl] }));
        server.respond(remoteDocumentUrl, movieResponse('Spirited Away'));
        server.respondOnce(localDocumentUrl, FakeResponse.notFound()); // Tombstone check
        server.respondOnce(localDocumentUrl, FakeResponse.notFound()); // Check before create
        server.respondOnce(localDocumentUrl, FakeResponse.created()); // Create

        // Arrange - Prepare service
        await Cloud.launch();
        await Cloud.register(Movie);
        await Events.emit('application-ready');

        // Act
        await Cloud.sync();

        // Assert
        expect(server.getRequests(typeIndexUrl)).toHaveLength(1);
        expect(server.getRequests(containerUrl)).toHaveLength(1);
        expect(server.getRequests(localDocumentUrl)).toHaveLength(3);
        expect(server.getRequests(remoteDocumentUrl)).toHaveLength(1);
        expect(server.getRequests()).toHaveLength(6);

        const movies = await Movie.all();
        expect(movies).toHaveLength(2);
        expect(arrayFind(movies, 'name', 'The Tale of Princess Kaguya')).toBeInstanceOf(Movie);
        expect(arrayFind(movies, 'name', 'Spirited Away')).toBeInstanceOf(Movie);
    });

    it('Syncs individual container updates', async () => {
        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0];
        const containerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const movieDocumentUrl = fakeDocumentUrl({ containerUrl });

        // Arrange - Prepare models
        const container = await MoviesContainer.at(parentContainerUrl).create({
            url: containerUrl,
            name: 'Movies',
        });

        const movie = await container.relatedMovies.create({
            url: `${movieDocumentUrl}#it`,
            name: 'The Tale of Princess Kaguya',
        });

        // Arrange - Prepare responses
        const server = SolidMock.server;
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';
        const typeIndexTurtle = `<${typeIndexUrl}> a <http://www.w3.org/ns/solid/terms#TypeIndex> .`;

        server.respondOnce(typeIndexUrl, FakeResponse.success(typeIndexTurtle)); // Initial fetch
        server.respondOnce(typeIndexUrl, FakeResponse.success(typeIndexTurtle)); // Check before update
        server.respondOnce(typeIndexUrl, FakeResponse.success()); // Update

        server.respondOnce(containerUrl, FakeResponse.notFound()); // Tombstone check
        server.respondOnce(containerUrl, FakeResponse.notFound()); // Check before create
        server.respondOnce(containerUrl, FakeResponse.created()); // Create
        server.respondOnce(
            // Read described-by header
            containerUrl,
            FakeResponse.success('<> a <http://www.w3.org/ns/ldp#Container> .'),
        );
        server.respondOnce(`${containerUrl}.meta`, FakeResponse.success()); // Update meta

        server.respondOnce(movieDocumentUrl, FakeResponse.notFound()); // Check before create
        server.respondOnce(movieDocumentUrl, FakeResponse.created()); // Create

        server.respondOnce(
            containerUrl,
            containerResponse({
                name: 'Movies',
                documentUrls: [movieDocumentUrl],
                createdAt: container.createdAt,
                updatedAt: container.updatedAt,
            }),
        ); // Sync
        server.respondOnce(movieDocumentUrl, FakeResponse.success(await movie.toTurtle())); // Sync children
        server.respondOnce(
            `${containerUrl}.meta`,
            containerResponse({
                name: 'Movies',
                documentUrls: [movieDocumentUrl],
                createdAt: container.createdAt,
                updatedAt: container.updatedAt,
            }),
        ); // Before update
        server.respondOnce(`${containerUrl}.meta`, FakeResponse.success()); // Update

        // Arrange - Prepare service
        await Cloud.launch();
        await Cloud.register(MoviesContainer);
        await Events.emit('application-ready');

        // Arrange - Initial sync
        await Cloud.sync();

        // Act
        await container.update({ name: 'Great Movies' });
        await Cloud.sync(container);

        // Assert
        expect(server.getRequests(typeIndexUrl)).toHaveLength(3);
        expect(server.getRequests(containerUrl)).toHaveLength(5);
        expect(server.getRequests(`${containerUrl}.meta`)).toHaveLength(3);
        expect(server.getRequests(movieDocumentUrl)).toHaveLength(3);
        expect(server.getRequests()).toHaveLength(14);

        expect(server.getRequests('PATCH', `${containerUrl}.meta`)[1]?.body).toEqualSparql(`
            DELETE DATA {
                @prefix crdt: <https://vocab.noeldemartin.com/crdt/> .
                @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
                @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.

                <${containerUrl}> rdfs:label "Movies" .
                <${containerUrl}#metadata> crdt:updatedAt "[[createdAt][.*]]"^^xsd:dateTime .
            } ;
            INSERT DATA {
                @prefix crdt: <https://vocab.noeldemartin.com/crdt/> .
                @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
                @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.

                <${containerUrl}> rdfs:label "Great Movies" .
                <${containerUrl}#metadata> crdt:updatedAt "[[updatedAt][.*]]"^^xsd:dateTime .

                <${containerUrl}#operation-[[.*]]>
                    a crdt:SetPropertyOperation ;
                    crdt:resource <${containerUrl}> ;
                    crdt:date "[[createdAt][.*]]"^^xsd:dateTime ;
                    crdt:property rdfs:label ;
                    crdt:value "Movies" .

                <${containerUrl}#operation-[[.*]]>
                    a crdt:SetPropertyOperation ;
                    crdt:resource <${containerUrl}> ;
                    crdt:date "[[updatedAt][.*]]"^^xsd:dateTime ;
                    crdt:property rdfs:label ;
                    crdt:value "Great Movies" .
            } .
        `);
    });

    it('Syncs individual container documents', async () => {
        // Arrange - Mint urls
        const containerUrl = Solid.requireUser().storageUrls[0];
        const documentUrl = fakeDocumentUrl({ containerUrl });

        // Arrange - Prepare models
        const container = await MoviesContainer.create({ url: containerUrl });

        // Arrange - Prepare responses
        const server = SolidMock.server;

        server.respondOnce(documentUrl, FakeResponse.notFound()); // Pull
        server.respondOnce(documentUrl, FakeResponse.notFound()); // Tombstone check
        server.respondOnce(documentUrl, FakeResponse.notFound()); // Check before create
        server.respondOnce(documentUrl, FakeResponse.created()); // Create

        // Arrange - Prepare service
        await Cloud.launch();
        await Cloud.register(MoviesContainer);
        await Events.emit('application-ready');

        // Act
        const movie = await container.relatedMovies.create({
            url: `${documentUrl}#it`,
            name: 'The Tale of Princess Kaguya',
        });

        await Cloud.sync(movie);

        // Assert
        expect(server.getRequests(documentUrl)).toHaveLength(4);
        expect(server.getRequests()).toHaveLength(4);
    });

    it('Creates containers with documents', async () => {
        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0];
        const containerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const documentUrl = fakeDocumentUrl({ containerUrl });

        // Arrange - Prepare models
        const container = await MoviesContainer.at(parentContainerUrl).create({
            url: containerUrl,
            name: 'Movies',
        });

        await container.relatedMovies.create({
            url: `${documentUrl}#it`,
            name: 'The Tale of Princess Kaguya',
        });

        // Arrange - Prepare responses
        const server = SolidMock.server;
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';
        const typeIndexTurtle = `<${typeIndexUrl}> a <http://www.w3.org/ns/solid/terms#TypeIndex> .`;

        server.respondOnce(typeIndexUrl, FakeResponse.success(typeIndexTurtle)); // Initial fetch
        server.respondOnce(typeIndexUrl, FakeResponse.success(typeIndexTurtle)); // Check before update
        server.respondOnce(typeIndexUrl, FakeResponse.success()); // Update

        server.respondOnce(containerUrl, FakeResponse.notFound()); // Tombstone check
        server.respondOnce(containerUrl, FakeResponse.notFound()); // Check before create
        server.respondOnce(containerUrl, FakeResponse.created()); // Create
        server.respondOnce(
            // Read described-by header
            containerUrl,
            FakeResponse.success('<> a <http://www.w3.org/ns/ldp#Container> .'),
        );
        server.respondOnce(`${containerUrl}.meta`, FakeResponse.success()); // Update meta

        server.respondOnce(documentUrl, FakeResponse.notFound()); // Check before create
        server.respondOnce(documentUrl, FakeResponse.created()); // Create

        // Arrange - Prepare service
        await Cloud.launch();
        await Cloud.register(MoviesContainer);
        await Events.emit('application-ready');

        // Act
        await Cloud.sync();

        // Assert
        expect(server.getRequests(typeIndexUrl)).toHaveLength(3);
        expect(server.getRequests(containerUrl)).toHaveLength(4);
        expect(server.getRequests(`${containerUrl}.meta`)).toHaveLength(1);
        expect(server.getRequests(documentUrl)).toHaveLength(2);
        expect(server.getRequests()).toHaveLength(10);
    });

    it('Skips pulling fresh documents', async () => {
        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0];
        const containerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const childContainerUrl = fakeContainerUrl({ baseUrl: containerUrl });
        const freshDocumentUrl = fakeDocumentUrl({ containerUrl });
        const staleDocumentUrl = fakeDocumentUrl({ containerUrl });
        const freshChildDocumentUrl = fakeDocumentUrl({ containerUrl: childContainerUrl });
        const staleChildDocumentUrl = fakeDocumentUrl({ containerUrl: childContainerUrl });

        // Arrange - Prepare models
        const workspace = await Workspace.at(parentContainerUrl).create({
            url: containerUrl,
            name: 'Tasks',
        });

        const tasksList = await workspace.relatedLists.create({
            url: childContainerUrl,
            name: 'Child Tasks',
        });

        await workspace.relatedTasks.create({
            url: `${freshDocumentUrl}#it`,
            name: 'One',
        });

        await workspace.relatedTasks.create({
            url: `${staleDocumentUrl}#it`,
            name: 'Two',
        });

        await tasksList.relatedTasks.create({
            url: `${freshChildDocumentUrl}#it`,
            name: 'Three',
        });

        await tasksList.relatedTasks.create({
            url: `${staleChildDocumentUrl}#it`,
            name: 'Four',
        });

        // Arrange - Prepare responses
        const now = Date.now();
        const server = SolidMock.server;
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';
        const typeIndexTurtle = `
            <${typeIndexUrl}> a <http://www.w3.org/ns/solid/terms#TypeIndex> .

            <#tasks>
                a <http://www.w3.org/ns/solid/terms#TypeRegistration> ;
                <http://www.w3.org/ns/solid/terms#forClass> <https://schema.org/Action> ;
                <http://www.w3.org/ns/solid/terms#instanceContainer> <${containerUrl}> .
        `;

        server.respondOnce(typeIndexUrl, FakeResponse.success(typeIndexTurtle)); // Initial fetch
        server.respondOnce(
            containerUrl,
            containerResponse({
                name: 'Tasks',
                documentUrls: [freshDocumentUrl, staleDocumentUrl, childContainerUrl],
                createdAt: workspace.createdAt,
                updatedAt: workspace.updatedAt,
                append: `
                    <${freshDocumentUrl}>
                        a <http://www.w3.org/ns/iana/media-types/text/turtle#Resource> ;
                        <http://purl.org/dc/terms/modified>
                            "${new Date(now).toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .

                    <${staleDocumentUrl}>
                        a <http://www.w3.org/ns/iana/media-types/text/turtle#Resource> ;
                        <http://purl.org/dc/terms/modified>
                            "${new Date(now).toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .
                `,
            }),
        ); // Container
        server.respondOnce(
            childContainerUrl,
            containerResponse({
                name: 'Child Tasks',
                documentUrls: [freshChildDocumentUrl, staleChildDocumentUrl],
                createdAt: tasksList.createdAt,
                updatedAt: tasksList.updatedAt,
                append: `
                    <${freshChildDocumentUrl}>
                        a <http://www.w3.org/ns/iana/media-types/text/turtle#Resource> ;
                        <http://purl.org/dc/terms/modified>
                            "${new Date(now).toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .

                    <${staleChildDocumentUrl}>
                        a <http://www.w3.org/ns/iana/media-types/text/turtle#Resource> ;
                        <http://purl.org/dc/terms/modified>
                            "${new Date(now).toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .
                `,
            }),
        ); // Child container
        server.respondOnce(freshDocumentUrl, taskResponse('One'));
        server.respondOnce(staleDocumentUrl, taskResponse('Two'));
        server.respondOnce(freshChildDocumentUrl, taskResponse('Three'));
        server.respondOnce(staleChildDocumentUrl, taskResponse('Four'));

        server.respondOnce(
            containerUrl,
            containerResponse({
                name: 'Tasks',
                documentUrls: [freshDocumentUrl, staleDocumentUrl, childContainerUrl],
                createdAt: workspace.createdAt,
                updatedAt: workspace.updatedAt,
                append: `
                    <${freshDocumentUrl}>
                        a <http://www.w3.org/ns/iana/media-types/text/turtle#Resource> ;
                        <http://purl.org/dc/terms/modified>
                            "${new Date(now).toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .

                    <${staleDocumentUrl}>
                        a <http://www.w3.org/ns/iana/media-types/text/turtle#Resource> ;
                        <http://purl.org/dc/terms/modified>
                            "${new Date(now + 1000).toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .
                `,
            }),
        ); // Container
        server.respondOnce(
            childContainerUrl,
            containerResponse({
                name: 'Child Tasks',
                documentUrls: [freshChildDocumentUrl, staleChildDocumentUrl],
                createdAt: tasksList.createdAt,
                updatedAt: tasksList.updatedAt,
                append: `
                    <${freshChildDocumentUrl}>
                        a <http://www.w3.org/ns/iana/media-types/text/turtle#Resource> ;
                        <http://purl.org/dc/terms/modified>
                            "${new Date(now).toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .

                    <${staleChildDocumentUrl}>
                        a <http://www.w3.org/ns/iana/media-types/text/turtle#Resource> ;
                        <http://purl.org/dc/terms/modified>
                            "${new Date(now + 1000).toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .
                `,
            }),
        ); // Child container
        server.respondOnce(staleDocumentUrl, taskResponse('Two'));
        server.respondOnce(staleChildDocumentUrl, taskResponse('Four'));

        // Arrange - Prepare service
        Cloud.ready = true;

        await Cloud.launch();
        await Cloud.register(Workspace);
        await Events.emit('application-ready');

        // Arrange - Initial sync
        await Cloud.sync();

        // Act
        await Cloud.sync();

        // Assert
        expect(server.getRequests(typeIndexUrl)).toHaveLength(1);
        expect(server.getRequests(containerUrl)).toHaveLength(2);
        expect(server.getRequests(childContainerUrl)).toHaveLength(2);
        expect(server.getRequests(freshDocumentUrl)).toHaveLength(1);
        expect(server.getRequests(staleDocumentUrl)).toHaveLength(2);
        expect(server.getRequests(freshChildDocumentUrl)).toHaveLength(1);
        expect(server.getRequests(staleChildDocumentUrl)).toHaveLength(2);
        expect(server.getRequests()).toHaveLength(11);
    });

    testRegisterVariants('Leaves tombstones behind', async (registerModels) => {
        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0];
        const containerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const documentUrl = fakeDocumentUrl({ containerUrl });

        // Arrange - Prepare models
        const container = await MoviesContainer.at(parentContainerUrl).create({ url: containerUrl, name: 'Movies' });
        const movie = await container.relatedMovies.create({ url: `${documentUrl}#it`, name: 'Spirited Away' });
        const movieTurtle = (await movie.toTurtle()).replaceAll(documentUrl, '');

        // Arrange - Prepare responses
        const server = SolidMock.server;
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';

        server.respond(typeIndexUrl, typeIndexResponse(containerUrl));
        server.respond(
            containerUrl,
            containerResponse({
                name: 'Movies',
                documentUrls: [documentUrl],
                createdAt: container.createdAt,
                updatedAt: container.updatedAt,
            }),
        );
        server.respondOnce(documentUrl, FakeResponse.success(movieTurtle)); // Pull
        server.respondOnce(documentUrl, FakeResponse.success(movieTurtle)); // Model GET before delete
        server.respondOnce(documentUrl, FakeResponse.success(movieTurtle)); // Client GET before update
        server.respondOnce(documentUrl, FakeResponse.success()); // Client Tombstone PATCH

        // Arrange - Prepare service
        await Cloud.launch();
        await registerModels();
        await Events.emit('application-ready');

        // Act
        await movie.softDelete();
        await Cloud.sync();

        // Assert
        expect(server.getRequests(typeIndexUrl)).toHaveLength(1);
        expect(server.getRequests(containerUrl)).toHaveLength(1);
        expect(server.getRequests(documentUrl)).toHaveLength(4);
        expect(server.getRequests()).toHaveLength(6);

        expect(server.getRequest('PATCH', documentUrl)?.body).toEqualSparql(`
            DELETE DATA { ${movieTurtle} } ;
            INSERT DATA {
                @prefix crdt: <https://vocab.noeldemartin.com/crdt/> .
                @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

                <#it-metadata>
                    a crdt:Tombstone ;
                    crdt:resource <#it> ;
                    crdt:deletedAt  "[[.*]]"^^xsd:dateTime .
            } .
        `);
    });

    testRegisterVariants('Tracks model updates', async (registerModels) => {
        // Arrange
        const container = await MoviesContainer.create({ name: 'Movies' });
        const movie = await container.relatedMovies.create({ name: 'The Boy and The Heron' });

        await registerModels();

        // Act
        await movie.update({ releaseDate: new Date('2023-07-14') });
        await container.relatedMovies.create({ name: 'The Tale of Princess Kaguya' });

        // Assert
        expect(Cloud.localChanges).toEqual(2);
    });

});

function testVariants<T>(description: string, variants: Record<string, T>, test: (variant: T) => unknown): void {
    for (const [name, data] of Object.entries(variants)) {
        it(`[${name}] ${description}`, () => test(data));
    }
}

function testRegisterVariants(description: string, test: (registerModels: () => unknown) => unknown): void {
    testVariants(
        description,
        {
            'model registration': () => Cloud.register(Movie),
            'container registration': () => Cloud.register(MoviesContainer),
        },
        test,
    );
}

function typeIndexResponse(containerUrl: string): Response {
    const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';

    return FakeResponse.success(`
        @prefix solid: <http://www.w3.org/ns/solid/terms#>.
        @prefix schema: <https://schema.org/>.

        <${typeIndexUrl}> a solid:TypeIndex .

        <#movies>
             a solid:TypeRegistration ;
             solid:forClass schema:Movie ;
             solid:instanceContainer <${containerUrl}> .
    `);
}

function containerResponse(
    options: { name?: string; documentUrls?: string[]; createdAt?: Date; updatedAt?: Date; append?: string } = {},
): Response {
    const name = options.name ?? 'Movies';
    const documentUrls = options.documentUrls ?? [];
    const createdAt = options.createdAt ?? new Date();
    const updatedAt = options.updatedAt ?? new Date();

    return FakeResponse.success(`
        @prefix dc: <http://purl.org/dc/terms/>.
        @prefix ldp: <http://www.w3.org/ns/ldp#>.
        @prefix posix: <http://www.w3.org/ns/posix/stat#>.
        @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
        @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
        @prefix crdt: <https://vocab.noeldemartin.com/crdt/>.

        <./> a ldp:Container, ldp:BasicContainer, ldp:Resource;
            rdfs:label "${name}";
            dc:created "2024-02-05T12:28:42Z"^^xsd:dateTime;
            dc:modified "2024-02-05T12:28:42Z"^^xsd:dateTime;
            ${documentUrls.length > 0 ? `ldp:contains ${documentUrls.map((url) => `<${url}>`).join(',')};` : ''}
            posix:mtime 1707136122.

        <./#metadata>
            a crdt:Metadata ;
            crdt:resource <./> ;
            crdt:createdAt "${createdAt.toISOString()}"^^xsd:dateTime ;
            crdt:updatedAt "${updatedAt.toISOString()}"^^xsd:dateTime .

        ${options.append ?? ''}
    `);
}

function movieResponse(title: string): Response {
    return FakeResponse.success(`
        @prefix schema: <https://schema.org/>.
        @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
        @prefix crdt: <https://vocab.noeldemartin.com/crdt/> .

        <#it>
            a schema:Movie;
            schema:datePublished "2001-07-20T00:00:00Z"^^xsd:dateTime;
            schema:name "${title}".

        <#it-metadata> a crdt:Metadata;
            crdt:resource <#it>;
            crdt:createdAt "2024-02-10T00:00:00Z"^^xsd:dateTime;
            crdt:updatedAt "2024-02-10T00:00:00Z"^^xsd:dateTime.
    `);
}

function taskResponse(name: string): Response {
    return FakeResponse.success(`
        @prefix schema: <https://schema.org/>.
        @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
        @prefix crdt: <https://vocab.noeldemartin.com/crdt/> .

        <#it>
            a schema:Action;
            schema:name "${name}".

        <#it-metadata> a crdt:Metadata;
            crdt:resource <#it>;
            crdt:createdAt "2024-02-10T00:00:00Z"^^xsd:dateTime;
            crdt:updatedAt "2024-02-10T00:00:00Z"^^xsd:dateTime.
    `);
}
