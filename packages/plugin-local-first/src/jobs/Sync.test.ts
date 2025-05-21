import { beforeEach, describe, expect, it } from 'vitest';
import { Events } from '@aerogel/core';
import { FakeResponse, FakeServer, fakeContainerUrl, fakeDocumentUrl } from '@noeldemartin/testing';
import { arrayFind, required } from '@noeldemartin/utils';
import { Solid } from '@aerogel/plugin-solid';
import { SolidTypeRegistration } from 'soukai-solid';

import Cloud from '@aerogel/plugin-local-first/services/Cloud';

import {
    containerResponse,
    movieResponse,
    setupCloudTests,
    taskResponse,
    testRegisterVariants,
    tombstoneResponse,
    typeIndexResponse,
} from '@aerogel/plugin-local-first/testing/cloud';
import Movie from '@aerogel/plugin-local-first/testing/stubs/Movie';
import MoviesContainer from '@aerogel/plugin-local-first/testing/stubs/MoviesContainer';
import Post from '@aerogel/plugin-local-first/testing/stubs/Post';
import SolidMock from '@aerogel/plugin-local-first/testing/mocks/Solid.mock';
import Workspace from '@aerogel/plugin-local-first/testing/stubs/Workspace';
import Person from '@aerogel/plugin-local-first/testing/stubs/Person';
import DocumentsCache from '@aerogel/plugin-local-first/services/DocumentsCache';

describe('Sync', () => {

    beforeEach(setupCloudTests);

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
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';

        FakeServer.respond(typeIndexUrl, typeIndexResponse({ [remoteContainerUrl]: '<https://schema.org/Movie>' }));
        FakeServer.respond(remoteContainerUrl, containerResponse({ name: 'Remote Movies' }));
        FakeServer.respondOnce(localContainerUrl, FakeResponse.notFound()); // Tombstone check
        FakeServer.respondOnce(localContainerUrl, FakeResponse.notFound()); // Check before create
        FakeServer.respondOnce(localContainerUrl, FakeResponse.created()); // Create
        FakeServer.respondOnce(
            // Read described-by header
            localContainerUrl,
            FakeResponse.success('<> a <http://www.w3.org/ns/ldp#Container> .'),
        );
        FakeServer.respondOnce(`${localContainerUrl}.meta`, FakeResponse.success()); // Update meta

        // Arrange - Prepare service
        await Cloud.launch();
        await Cloud.register(MoviesContainer);
        await Events.emit('application-ready');

        // Act
        const updates: number[] = [];

        await Cloud.sync({ onUpdated: (progress) => updates.push(progress) });

        // Assert
        expect(updates).toEqual([0, 0.9, 1]);

        expect(FakeServer.getRequests(typeIndexUrl)).toHaveLength(3);
        expect(FakeServer.getRequests(remoteContainerUrl)).toHaveLength(1);
        expect(FakeServer.getRequests(localContainerUrl)).toHaveLength(4);
        expect(FakeServer.getRequests(localContainerUrl + '.meta')).toHaveLength(1);
        expect(FakeServer.getRequests()).toHaveLength(9);
        expect(FakeServer.getRequest('PATCH', typeIndexUrl)?.body).toEqualSparql(`
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

        expect(Cloud.localModelUpdates).toEqual({});
    });

    it('Syncs container documents', async () => {
        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0] + 'movies/';
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
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';

        FakeServer.respond(typeIndexUrl, typeIndexResponse({ [containerUrl]: '<https://schema.org/Movie>' }));
        FakeServer.respond(
            containerUrl,
            containerResponse({
                name: 'Remote Movies',
                documentUrls: [remoteDocumentUrl],
                createdAt: container.createdAt,
                updatedAt: container.updatedAt,
            }),
        );
        FakeServer.respond(remoteDocumentUrl, movieResponse('Spirited Away'));
        FakeServer.respondOnce(localDocumentUrl, FakeResponse.notFound()); // Check before create
        FakeServer.respondOnce(localDocumentUrl, FakeResponse.created()); // Create

        // Arrange - Prepare service
        await Cloud.launch();
        await Cloud.register(MoviesContainer);
        await Events.emit('application-ready');

        // Act
        const updates: number[] = [];

        await Cloud.sync({ onUpdated: (progress) => updates.push(progress) });

        // Assert
        expect(updates).toEqual([0, 0.9, 0.95, 1]);
        expect(FakeServer.getRequests(typeIndexUrl)).toHaveLength(1);
        expect(FakeServer.getRequests(containerUrl)).toHaveLength(1);
        expect(FakeServer.getRequests(localDocumentUrl)).toHaveLength(2);
        expect(FakeServer.getRequests(remoteDocumentUrl)).toHaveLength(1);
        expect(FakeServer.getRequests()).toHaveLength(5);

        const movies = await Movie.from(containerUrl).all();
        expect(movies).toHaveLength(2);
        expect(arrayFind(movies, 'name', 'The Tale of Princess Kaguya')).toBeInstanceOf(Movie);
        expect(arrayFind(movies, 'name', 'Spirited Away')).toBeInstanceOf(Movie);

        expect(Cloud.localModelUpdates).toEqual({});
    });

    it('Pushes container documents', async () => {
        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0] + 'movies/';
        const containerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const localDocumentUrl = fakeDocumentUrl({ containerUrl });

        // Arrange - Prepare models
        const container = await MoviesContainer.at(parentContainerUrl).create({
            url: containerUrl,
            name: 'Remote Movies',
        });

        await container.relatedMovies.create({ url: `${localDocumentUrl}#it`, name: 'The Tale of Princess Kaguya' });

        // Arrange - Prepare responses
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';

        FakeServer.respond(typeIndexUrl, typeIndexResponse({ [containerUrl]: '<https://schema.org/Movie>' }));
        FakeServer.respond(
            containerUrl,
            containerResponse({
                name: 'Remote Movies',
                documentUrls: [],
                createdAt: container.createdAt,
                updatedAt: container.updatedAt,
            }),
        );
        FakeServer.respondOnce(localDocumentUrl, FakeResponse.notFound()); // Check before create
        FakeServer.respondOnce(localDocumentUrl, FakeResponse.created()); // Create

        // Arrange - Prepare service
        await Cloud.launch();
        await Cloud.register(MoviesContainer);
        await Events.emit('application-ready');

        // Act
        const updates: number[] = [];

        await Cloud.sync({ onUpdated: (progress) => updates.push(progress) });

        // Assert
        expect(updates).toEqual([0, 0.9, 1]);
        expect(FakeServer.getRequests(typeIndexUrl)).toHaveLength(1);
        expect(FakeServer.getRequests(containerUrl)).toHaveLength(1);
        expect(FakeServer.getRequests(localDocumentUrl)).toHaveLength(2);
        expect(FakeServer.getRequests()).toHaveLength(4);

        const movies = await Movie.from(containerUrl).all();
        expect(movies).toHaveLength(1);
        expect(arrayFind(movies, 'name', 'The Tale of Princess Kaguya')).toBeInstanceOf(Movie);

        expect(Cloud.localModelUpdates).toEqual({});
    });

    it('Pulls container documents', async () => {
        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0] + 'movies/';
        const containerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const remoteDocumentUrl = fakeDocumentUrl({ containerUrl });

        // Arrange - Prepare models
        const container = await MoviesContainer.at(parentContainerUrl).create({
            url: containerUrl,
            name: 'Remote Movies',
        });

        // Arrange - Prepare responses
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';

        FakeServer.respond(typeIndexUrl, typeIndexResponse({ [containerUrl]: '<https://schema.org/Movie>' }));
        FakeServer.respond(
            containerUrl,
            containerResponse({
                name: 'Remote Movies',
                documentUrls: [remoteDocumentUrl],
                createdAt: container.createdAt,
                updatedAt: container.updatedAt,
            }),
        );
        FakeServer.respond(remoteDocumentUrl, movieResponse('Spirited Away'));

        // Arrange - Prepare service
        await Cloud.launch();
        await Cloud.register(MoviesContainer);
        await Events.emit('application-ready');

        // Act
        const updates: number[] = [];

        await Cloud.sync({ onUpdated: (progress) => updates.push(progress) });

        // Assert
        expect(updates).toEqual([0, 0.9, 1]);
        expect(FakeServer.getRequests(typeIndexUrl)).toHaveLength(1);
        expect(FakeServer.getRequests(containerUrl)).toHaveLength(1);
        expect(FakeServer.getRequests(remoteDocumentUrl)).toHaveLength(1);
        expect(FakeServer.getRequests()).toHaveLength(3);

        const movies = await Movie.from(containerUrl).all();
        expect(movies).toHaveLength(1);
        expect(arrayFind(movies, 'name', 'Spirited Away')).toBeInstanceOf(Movie);

        expect(Cloud.localModelUpdates).toEqual({});
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
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';

        FakeServer.respond(typeIndexUrl, typeIndexResponse({ [containerUrl]: '<https://schema.org/Movie>' }));
        FakeServer.respond(containerUrl, containerResponse({ name: 'Movies', documentUrls: [remoteDocumentUrl] }));
        FakeServer.respond(remoteDocumentUrl, movieResponse('Spirited Away'));
        FakeServer.respondOnce(localDocumentUrl, FakeResponse.notFound()); // Tombstone check
        FakeServer.respondOnce(localDocumentUrl, FakeResponse.notFound()); // Check before create
        FakeServer.respondOnce(localDocumentUrl, FakeResponse.created()); // Create

        // Arrange - Prepare service
        await Cloud.launch();
        await Cloud.register(Movie);
        await Events.emit('application-ready');

        // Act
        const updates: number[] = [];

        await Cloud.sync({ onUpdated: (progress) => updates.push(progress) });

        // Assert
        expect(updates).toEqual([0, 0.9, 1]);

        expect(FakeServer.getRequests(typeIndexUrl)).toHaveLength(1);
        expect(FakeServer.getRequests(containerUrl)).toHaveLength(1);
        expect(FakeServer.getRequests(localDocumentUrl)).toHaveLength(3);
        expect(FakeServer.getRequests(remoteDocumentUrl)).toHaveLength(1);
        expect(FakeServer.getRequests()).toHaveLength(6);

        const movies = await Movie.all();
        expect(movies).toHaveLength(2);
        expect(arrayFind(movies, 'name', 'The Tale of Princess Kaguya')).toBeInstanceOf(Movie);
        expect(arrayFind(movies, 'name', 'Spirited Away')).toBeInstanceOf(Movie);

        expect(Cloud.localModelUpdates).toEqual({});
    });

    it('Syncs individual container updates', async () => {
        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0] + 'movies/';
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
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';
        const typeIndexTurtle = `<${typeIndexUrl}> a <http://www.w3.org/ns/solid/terms#TypeIndex> .`;

        FakeServer.respondOnce(typeIndexUrl, FakeResponse.success(typeIndexTurtle)); // Initial fetch
        FakeServer.respondOnce(typeIndexUrl, FakeResponse.success(typeIndexTurtle)); // Check before update
        FakeServer.respondOnce(typeIndexUrl, FakeResponse.success()); // Update

        FakeServer.respondOnce(containerUrl, FakeResponse.notFound()); // Tombstone check
        FakeServer.respondOnce(containerUrl, FakeResponse.notFound()); // Check before create
        FakeServer.respondOnce(containerUrl, FakeResponse.created()); // Create
        FakeServer.respondOnce(
            // Read described-by header
            containerUrl,
            FakeResponse.success('<> a <http://www.w3.org/ns/ldp#Container> .'),
        );
        FakeServer.respondOnce(`${containerUrl}.meta`, FakeResponse.success()); // Update meta

        FakeServer.respondOnce(movieDocumentUrl, FakeResponse.notFound()); // Check before create
        FakeServer.respondOnce(movieDocumentUrl, FakeResponse.created()); // Create

        FakeServer.respondOnce(
            containerUrl,
            containerResponse({
                name: 'Movies',
                documentUrls: [movieDocumentUrl],
                createdAt: container.createdAt,
                updatedAt: container.updatedAt,
            }),
        ); // Sync
        FakeServer.respondOnce(movieDocumentUrl, FakeResponse.success(await movie.toTurtle())); // Sync children
        FakeServer.respondOnce(
            `${containerUrl}.meta`,
            containerResponse({
                name: 'Movies',
                documentUrls: [movieDocumentUrl],
                createdAt: container.createdAt,
                updatedAt: container.updatedAt,
            }),
        ); // Before update
        FakeServer.respondOnce(`${containerUrl}.meta`, FakeResponse.success()); // Update

        // Arrange - Prepare service
        await Cloud.launch();
        await Cloud.register(MoviesContainer);
        await Events.emit('application-ready');

        // Arrange - Initial sync
        await Cloud.sync();

        // Act
        const updates: number[] = [];

        await container.update({ name: 'Great Movies' });
        await Cloud.sync({ model: container, onUpdated: (progress) => updates.push(progress) });

        // Assert
        expect(updates).toEqual([0, 0.9, 1]);

        expect(FakeServer.getRequests(typeIndexUrl)).toHaveLength(3);
        expect(FakeServer.getRequests(containerUrl)).toHaveLength(5);
        expect(FakeServer.getRequests(`${containerUrl}.meta`)).toHaveLength(3);
        expect(FakeServer.getRequests(movieDocumentUrl)).toHaveLength(3);
        expect(FakeServer.getRequests()).toHaveLength(14);

        expect(FakeServer.getRequests('PATCH', `${containerUrl}.meta`)[1]?.body).toEqualSparql(`
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

        expect(Cloud.localModelUpdates).toEqual({});
    });

    it('Syncs individual container documents', async () => {
        // Arrange - Mint urls
        const containerUrl = Solid.requireUser().storageUrls[0];
        const documentUrl = fakeDocumentUrl({ containerUrl });

        // Arrange - Prepare models
        const container = await MoviesContainer.create({ url: containerUrl });

        // Arrange - Prepare responses

        FakeServer.respondOnce(documentUrl, FakeResponse.notFound()); // Pull
        FakeServer.respondOnce(documentUrl, FakeResponse.notFound()); // Tombstone check
        FakeServer.respondOnce(documentUrl, FakeResponse.notFound()); // Check before create
        FakeServer.respondOnce(documentUrl, FakeResponse.created()); // Create

        // Arrange - Prepare service
        await Cloud.launch();
        await Cloud.register(MoviesContainer);
        await Events.emit('application-ready');

        // Act
        const updates: number[] = [];
        const movie = await container.relatedMovies.create({
            url: `${documentUrl}#it`,
            name: 'The Tale of Princess Kaguya',
        });

        await Cloud.sync({ model: movie, onUpdated: (progress) => updates.push(progress) });

        // Assert
        expect(updates).toEqual([0, 0.9, 1]);

        expect(FakeServer.getRequests(documentUrl)).toHaveLength(4);
        expect(FakeServer.getRequests()).toHaveLength(4);

        expect(Cloud.localModelUpdates).toEqual({});
    });

    it('Creates containers with documents', async () => {
        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0] + 'movies/';
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
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';
        const typeIndexTurtle = `<${typeIndexUrl}> a <http://www.w3.org/ns/solid/terms#TypeIndex> .`;

        FakeServer.respondOnce(typeIndexUrl, FakeResponse.success(typeIndexTurtle)); // Initial fetch
        FakeServer.respondOnce(typeIndexUrl, FakeResponse.success(typeIndexTurtle)); // Check before update
        FakeServer.respondOnce(typeIndexUrl, FakeResponse.success()); // Update

        FakeServer.respondOnce(containerUrl, FakeResponse.notFound()); // Tombstone check
        FakeServer.respondOnce(containerUrl, FakeResponse.notFound()); // Check before create
        FakeServer.respondOnce(containerUrl, FakeResponse.created()); // Create
        FakeServer.respondOnce(
            // Read described-by header
            containerUrl,
            FakeResponse.success('<> a <http://www.w3.org/ns/ldp#Container> .'),
        );
        FakeServer.respondOnce(`${containerUrl}.meta`, FakeResponse.success()); // Update meta

        FakeServer.respondOnce(documentUrl, FakeResponse.notFound()); // Check before create
        FakeServer.respondOnce(documentUrl, FakeResponse.created()); // Create

        // Arrange - Prepare service
        await Cloud.launch();
        await Cloud.register(MoviesContainer);
        await Events.emit('application-ready');

        // Act
        await Cloud.sync();

        // Assert
        expect(FakeServer.getRequests(typeIndexUrl)).toHaveLength(3);
        expect(FakeServer.getRequests(containerUrl)).toHaveLength(4);
        expect(FakeServer.getRequests(`${containerUrl}.meta`)).toHaveLength(1);
        expect(FakeServer.getRequests(documentUrl)).toHaveLength(2);
        expect(FakeServer.getRequests()).toHaveLength(10);

        expect(Cloud.localModelUpdates).toEqual({});
    });

    it('Skips pulling fresh documents', async () => {
        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0] + 'tasks/';
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
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';

        FakeServer.respond(
            typeIndexUrl,
            `
            <${typeIndexUrl}> a <http://www.w3.org/ns/solid/terms#TypeIndex> .

            <#tasks>
                a <http://www.w3.org/ns/solid/terms#TypeRegistration> ;
                <http://www.w3.org/ns/solid/terms#forClass> <https://schema.org/Action> ;
                <http://www.w3.org/ns/solid/terms#instanceContainer> <${containerUrl}> .
        `,
        );
        FakeServer.respondOnce(
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
        FakeServer.respondOnce(
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
        FakeServer.respondOnce(freshDocumentUrl, taskResponse('One'));
        FakeServer.respondOnce(staleDocumentUrl, taskResponse('Two'));
        FakeServer.respondOnce(freshChildDocumentUrl, taskResponse('Three'));
        FakeServer.respondOnce(staleChildDocumentUrl, taskResponse('Four'));

        FakeServer.respondOnce(
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
        FakeServer.respondOnce(
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
        FakeServer.respondOnce(staleDocumentUrl, taskResponse('Two'));
        FakeServer.respondOnce(staleChildDocumentUrl, taskResponse('Four'));

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
        expect(FakeServer.getRequests(typeIndexUrl)).toHaveLength(2);
        expect(FakeServer.getRequests(containerUrl)).toHaveLength(2);
        expect(FakeServer.getRequests(childContainerUrl)).toHaveLength(2);
        expect(FakeServer.getRequests(freshDocumentUrl)).toHaveLength(1);
        expect(FakeServer.getRequests(staleDocumentUrl)).toHaveLength(2);
        expect(FakeServer.getRequests(freshChildDocumentUrl)).toHaveLength(1);
        expect(FakeServer.getRequests(staleChildDocumentUrl)).toHaveLength(2);
        expect(FakeServer.getRequests()).toHaveLength(12);
    });

    it('Ignores missing children', async () => {
        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0] + 'tasks/';
        const containerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const existingChildDocumentUrl = fakeContainerUrl({ baseUrl: containerUrl });
        const notFoundChildDocumentUrl = fakeDocumentUrl({ containerUrl });
        const existingChildContainerUrl = fakeContainerUrl({ baseUrl: containerUrl });
        const notFoundChildContainerUrl = fakeContainerUrl({ baseUrl: containerUrl });

        // Arrange - Prepare responses
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';
        const typeIndexTurtle = `
            <${typeIndexUrl}> a <http://www.w3.org/ns/solid/terms#TypeIndex> .

            <#tasks>
                a <http://www.w3.org/ns/solid/terms#TypeRegistration> ;
                <http://www.w3.org/ns/solid/terms#forClass> <https://schema.org/Action> ;
                <http://www.w3.org/ns/solid/terms#instanceContainer> <${containerUrl}> .
        `;

        FakeServer.respondOnce(typeIndexUrl, FakeResponse.success(typeIndexTurtle)); // Initial fetch
        FakeServer.respondOnce(
            containerUrl,
            containerResponse({
                name: 'Tasks',
                documentUrls: [
                    existingChildDocumentUrl,
                    notFoundChildDocumentUrl,
                    existingChildContainerUrl,
                    notFoundChildContainerUrl,
                ],
            }),
        ); // Container
        FakeServer.respondOnce(existingChildDocumentUrl, taskResponse());
        FakeServer.respondOnce(notFoundChildDocumentUrl, FakeResponse.notFound());
        FakeServer.respondOnce(existingChildContainerUrl, containerResponse());
        FakeServer.respondOnce(notFoundChildContainerUrl, FakeResponse.notFound());

        // Arrange - Prepare service
        Cloud.ready = true;

        await Cloud.launch();
        await Cloud.register(Workspace);
        await Events.emit('application-ready');

        // Act
        await Cloud.sync();

        // Assert
        const workspace = required(await Workspace.find(containerUrl));

        await workspace.loadRelationIfUnloaded('tasks');
        await workspace.loadRelationIfUnloaded('lists');

        expect(workspace.tasks).toHaveLength(1);
        expect(workspace.lists).toHaveLength(1);
    });

    it('Ignores malformed documents', async () => {
        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0] + 'movies/';
        const containerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const firstDocumentUrl = fakeDocumentUrl({ containerUrl: containerUrl });
        const secondDocumentUrl = fakeDocumentUrl({ containerUrl: containerUrl });
        const thirdDocumentUrl = fakeDocumentUrl({ containerUrl: containerUrl });
        const fourthDocumentUrl = fakeDocumentUrl({ containerUrl: containerUrl });

        // Arrange - Prepare models
        const container = await MoviesContainer.at(parentContainerUrl).create({
            url: containerUrl,
            name: 'Movies',
        });
        const movie = await container.relatedMovies.create({
            url: `${thirdDocumentUrl}#it`,
            name: 'The Tale of Princess Kaguya',
        });

        await container.relatedMovies.create({ url: `${secondDocumentUrl}#it`, name: 'Spirited Away' });
        await movie.update({ name: 'かぐや姫の物語' });

        // Arrange - Prepare responses
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';
        const typeIndexTurtle = `
            <${typeIndexUrl}> a <http://www.w3.org/ns/solid/terms#TypeIndex> .

            <#tasks>
                a <http://www.w3.org/ns/solid/terms#TypeRegistration> ;
                <http://www.w3.org/ns/solid/terms#forClass> <https://schema.org/Movie> ;
                <http://www.w3.org/ns/solid/terms#instanceContainer> <${containerUrl}> .
        `;

        FakeServer.respondOnce(typeIndexUrl, FakeResponse.success(typeIndexTurtle)); // Initial fetch
        FakeServer.respondOnce(
            containerUrl,
            containerResponse({
                documentUrls: [firstDocumentUrl, secondDocumentUrl, thirdDocumentUrl, fourthDocumentUrl],
                createdAt: container.createdAt,
                updatedAt: container.updatedAt,
            }),
        ); // Container
        FakeServer.respondOnce(firstDocumentUrl, FakeResponse.success('invalid turtle'));
        FakeServer.respondOnce(secondDocumentUrl, FakeResponse.success('invalid turtle'));
        FakeServer.respondOnce(thirdDocumentUrl, FakeResponse.success('invalid turtle'));
        FakeServer.respondOnce(fourthDocumentUrl, FakeResponse.success('invalid turtle'));

        // Arrange - Prepare service
        Cloud.ready = true;
        Cloud.localModelUpdates = { [movie.url]: 1 };

        await Cloud.launch();
        await Cloud.register(MoviesContainer);
        await Events.emit('application-ready');

        // Act
        await Cloud.sync();

        // Assert
        expect(FakeServer.getRequests()).toHaveLength(6);
        expect(Cloud.localModelUpdates).toEqual({ [movie.url]: 1 });
    });

    it('Ignores malformed documents in individual syncs', async () => {
        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0] + 'movies/';
        const containerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const documentUrl = fakeDocumentUrl({ containerUrl: containerUrl });

        // Arrange - Prepare models
        const container = await MoviesContainer.at(parentContainerUrl).create({ url: containerUrl, name: 'Movies' });
        const movie = await container.relatedMovies.create({
            url: `${documentUrl}#it`,
            name: 'The Tale of Princess Kaguya',
        });

        await movie.update({ name: 'かぐや姫の物語' });

        // Arrange - Prepare responses

        FakeServer.respondOnce(documentUrl, FakeResponse.success('invalid turtle'));

        // Arrange - Prepare service
        Cloud.ready = true;
        Cloud.localModelUpdates = { [movie.url]: 1 };

        await Cloud.launch();
        await Cloud.register(MoviesContainer);
        await Events.emit('application-ready');

        // Act
        await Cloud.sync(movie);

        // Assert
        expect(FakeServer.getRequests()).toHaveLength(1);
        expect(Cloud.localModelUpdates).toEqual({ [movie.url]: 1 });
    });

    it('Syncs nested fresh containers', async () => {
        // Arrange - Mint urls
        const rootContainerUrl = Solid.requireUser().storageUrls[0];
        const parentContainerUrl = fakeContainerUrl({ baseUrl: rootContainerUrl });
        const containerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const documentUrl = fakeDocumentUrl({ containerUrl });

        // Arrange - Prepare models
        const parentContainer = await Workspace.at(rootContainerUrl).create({
            url: parentContainerUrl,
            name: 'Tasks',
        });
        const container = await parentContainer.relatedLists.create({
            url: containerUrl,
            name: 'More Tasks',
        });
        const task = await container.relatedTasks.create({ url: `${documentUrl}#it`, name: 'Sync' });

        // Arrange - Prepare responses
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';
        const now = Date.now();

        FakeServer.respond(typeIndexUrl, typeIndexResponse({ [parentContainerUrl]: '<https://schema.org/Action>' }));
        FakeServer.respond(parentContainerUrl, containerResponse({ name: 'Tasks', documentUrls: [containerUrl] }));
        FakeServer.respond(
            containerUrl,
            containerResponse({
                name: 'More Tasks',
                documentUrls: [documentUrl],
                append: `
                <${documentUrl}>
                    a <http://www.w3.org/ns/iana/media-types/text/turtle#Resource> ;
                    <http://purl.org/dc/terms/modified>
                        "${new Date(now).toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .
            `,
            }),
        );
        FakeServer.respond(documentUrl, await task.toTurtle());
        FakeServer.respond(`${parentContainerUrl}.meta`);
        FakeServer.respond(`${containerUrl}.meta`);

        // Arrange - Prepare service
        await DocumentsCache.remember(documentUrl, now);
        await Cloud.launch();
        await Cloud.register(Workspace);
        await Events.emit('application-ready');

        // Act
        await Cloud.sync();

        // Assert
        expect(FakeServer.getRequests(typeIndexUrl)).toHaveLength(1);
        expect(FakeServer.getRequests(parentContainerUrl)).toHaveLength(2);
        expect(FakeServer.getRequests(containerUrl)).toHaveLength(2);
        expect(FakeServer.getRequests(`${parentContainerUrl}.meta`)).toHaveLength(1);
        expect(FakeServer.getRequests(`${containerUrl}.meta`)).toHaveLength(1);
        expect(FakeServer.getRequests()).toHaveLength(7);

        expect(Cloud.localModelUpdates).toEqual({});
    });

    it('Ignores nested container registrations', async () => {
        // Arrange - Mint urls
        const rootContainerUrl = Solid.requireUser().storageUrls[0];
        const parentContainerUrl = fakeContainerUrl({ baseUrl: rootContainerUrl });
        const containerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const parentDocumentUrl = fakeDocumentUrl({ containerUrl: parentContainerUrl });
        const documentUrl = fakeDocumentUrl({ containerUrl });

        // Arrange - Prepare responses
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';

        FakeServer.respond(
            typeIndexUrl,
            typeIndexResponse({
                [parentContainerUrl]: '<https://schema.org/Movie>',
                [containerUrl]: '<https://schema.org/Movie>',
            }),
        );
        FakeServer.respond(parentContainerUrl, containerResponse({ documentUrls: [containerUrl, parentDocumentUrl] }));
        FakeServer.respond(containerUrl, containerResponse({ documentUrls: [documentUrl] }));
        FakeServer.respond(parentDocumentUrl, movieResponse());

        // Arrange - Prepare service
        await Cloud.launch();
        await Cloud.register(MoviesContainer);
        await Events.emit('application-ready');

        // Act
        await Cloud.sync();

        // Assert
        expect(FakeServer.getRequests(typeIndexUrl)).toHaveLength(1);
        expect(FakeServer.getRequests(parentContainerUrl)).toHaveLength(1);
        expect(FakeServer.getRequests(containerUrl)).toHaveLength(1);
        expect(FakeServer.getRequests(parentDocumentUrl)).toHaveLength(1);
        expect(FakeServer.getRequests()).toHaveLength(4);
    });

    it('Works with circular relationships', async () => {
        // Arrange
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';
        const containerUrl = fakeContainerUrl();
        const documentUrl = fakeDocumentUrl({ containerUrl });
        const typeIndexTurtle = `
            <${typeIndexUrl}> a <http://www.w3.org/ns/solid/terms#TypeIndex> .

            <#posts>
                a <http://www.w3.org/ns/solid/terms#TypeRegistration> ;
                <http://www.w3.org/ns/solid/terms#forClass> <https://schema.org/Article> ;
                <http://www.w3.org/ns/solid/terms#instanceContainer> <${containerUrl}> .
        `;

        FakeServer.respondOnce(typeIndexUrl, FakeResponse.success(typeIndexTurtle));
        FakeServer.respondOnce(containerUrl, containerResponse({ documentUrls: [documentUrl] }));
        FakeServer.respondOnce(
            documentUrl,
            `
                <#it>
                    a <https://schema.org/Article> ;
                    <https://schema.org/name> "Title" ;
                    <https://schema.org/author> <#author> .

                <#author>
                    a <https://schema.org/Person> ;
                    <https://schema.org/name> "Author" .
            `,
        );

        Cloud.ready = true;

        await Cloud.launch();
        await Cloud.register(Post);
        await Events.emit('application-ready');

        // Act
        await Cloud.sync();

        // Assert
        const [post] = await Post.all();

        expect(post).toBeInstanceOf(Post);
        expect(post?.author).toBeInstanceOf(Person);
        expect(post?.author?.posts?.[0]).toBe(post);
    });

    testRegisterVariants('Leaves tombstones behind', async (registerModels) => {
        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0] + 'movies/';
        const containerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const documentUrl = fakeDocumentUrl({ containerUrl });

        // Arrange - Prepare models
        const container = await MoviesContainer.at(parentContainerUrl).create({
            url: containerUrl,
            name: 'Movies',
        });
        const movie = await container.relatedMovies.create({ url: `${documentUrl}#it`, name: 'Spirited Away' });
        const movieTurtle = (await movie.toTurtle()).replaceAll(documentUrl, '');

        // Arrange - Prepare responses
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';

        FakeServer.respond(typeIndexUrl, typeIndexResponse({ [containerUrl]: '<https://schema.org/Movie>' }));
        FakeServer.respond(
            containerUrl,
            containerResponse({
                documentUrls: [documentUrl],
                createdAt: container.createdAt,
                updatedAt: container.updatedAt,
            }),
        );
        FakeServer.respondOnce(documentUrl, FakeResponse.success(movieTurtle)); // Pull
        FakeServer.respondOnce(documentUrl, FakeResponse.success(movieTurtle)); // Model GET before delete
        FakeServer.respondOnce(documentUrl, FakeResponse.success(movieTurtle)); // Client GET before update
        FakeServer.respondOnce(documentUrl, FakeResponse.success()); // Client Tombstone PATCH

        // Arrange - Prepare service
        await Cloud.launch();
        await registerModels();
        await Events.emit('application-ready');

        // Act
        await movie.softDelete();
        await Cloud.sync();

        // Assert
        expect(FakeServer.getRequests(typeIndexUrl)).toHaveLength(1);
        expect(FakeServer.getRequests(containerUrl)).toHaveLength(1);
        expect(FakeServer.getRequests(documentUrl)).toHaveLength(4);
        expect(FakeServer.getRequests()).toHaveLength(6);

        expect(FakeServer.getRequest('PATCH', documentUrl)?.body).toEqualSparql(`
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

        expect(Cloud.localModelUpdates).toEqual({});
    });

    testRegisterVariants('Deletes tombstone models', async (registerModels, variant) => {
        const usingContainers = variant === 'container registration';

        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0] + 'movies/';
        const containerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const documentUrl = fakeDocumentUrl({ containerUrl });

        // Arrange - Prepare models
        const container = await MoviesContainer.at(parentContainerUrl).create({
            url: containerUrl,
            name: 'Movies',
        });

        const movie = await container.relatedMovies.create({ url: `${documentUrl}#it`, name: 'Spirited Away' });

        // Arrange - Prepare initial sync responses
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';

        FakeServer.respondOnce(typeIndexUrl, typeIndexResponse());

        if (usingContainers) {
            FakeServer.respondOnce(containerUrl, FakeResponse.notFound()); // Tombstone check
            FakeServer.respondOnce(containerUrl, FakeResponse.notFound()); // Check before create
            FakeServer.respondOnce(containerUrl, FakeResponse.created()); // Create
            FakeServer.respondOnce(
                // Read described-by header
                containerUrl,
                FakeResponse.success('<> a <http://www.w3.org/ns/ldp#Container> .'),
            );
            FakeServer.respondOnce(`${containerUrl}.meta`, FakeResponse.success()); // Update meta
        } else {
            FakeServer.respondOnce(documentUrl, FakeResponse.notFound()); // Tombstone check
        }

        FakeServer.respondOnce(typeIndexUrl, typeIndexResponse()); // Check before update
        FakeServer.respondOnce(typeIndexUrl, FakeResponse.success()); // Update
        FakeServer.respondOnce(
            typeIndexUrl,
            typeIndexResponse({ [containerUrl]: '<https://schema.org/Movie>' }), // Second sync
        );

        FakeServer.respondOnce(documentUrl, FakeResponse.notFound()); // Existence check
        FakeServer.respondOnce(documentUrl, FakeResponse.success()); // Create

        // Arrange - Prepare service
        if (!usingContainers) {
            Cloud.modelCollections[Movie.modelName] = [containerUrl];
        }

        await Cloud.launch();
        await registerModels();
        await Events.emit('application-ready');

        // Arrange - Initial sync
        await Cloud.sync();

        // Arrange - Sync responses
        FakeServer.respond(
            containerUrl,
            containerResponse({
                documentUrls: [documentUrl],
                createdAt: container.createdAt,
                updatedAt: container.updatedAt,
            }),
        );

        FakeServer.respond(documentUrl, tombstoneResponse());

        // Act
        await Cloud.sync();

        // Assert
        const freshMovie = await Movie.at(containerUrl).find(movie.url);

        expect(freshMovie).toBeNull();

        if (usingContainers) {
            const freshContainer = await container.fresh();

            await freshContainer.loadRelation('movies');

            expect(freshContainer.movies).toHaveLength(0);
            expect(freshContainer.resourceUrls).toHaveLength(1);

            expect(FakeServer.getRequests(typeIndexUrl)).toHaveLength(4);
            expect(FakeServer.getRequests(containerUrl)).toHaveLength(5);
            expect(FakeServer.getRequests(documentUrl)).toHaveLength(3);
            expect(FakeServer.getRequests(`${containerUrl}.meta`)).toHaveLength(1);
            expect(FakeServer.getRequests()).toHaveLength(13);
        } else {
            expect(FakeServer.getRequests(typeIndexUrl)).toHaveLength(4);
            expect(FakeServer.getRequests(containerUrl)).toHaveLength(1);
            expect(FakeServer.getRequests(documentUrl)).toHaveLength(5);
            expect(FakeServer.getRequests()).toHaveLength(10);
        }

        expect(Cloud.localModelUpdates).toEqual({});
    });

    testRegisterVariants('Deletes updated tombstone models', async (registerModels, variant) => {
        const usingContainers = variant === 'container registration';

        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0] + 'movies/';
        const containerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const documentUrl = fakeDocumentUrl({ containerUrl });

        // Arrange - Prepare models
        const container = await MoviesContainer.at(parentContainerUrl).create({
            url: containerUrl,
            name: 'Movies',
        });

        const movie = await container.relatedMovies.create({ url: `${documentUrl}#it`, name: 'Spirited Away' });

        // Arrange - Prepare initial sync responses
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';

        FakeServer.respondOnce(typeIndexUrl, typeIndexResponse());

        if (usingContainers) {
            FakeServer.respondOnce(containerUrl, FakeResponse.notFound()); // Tombstone check
            FakeServer.respondOnce(containerUrl, FakeResponse.notFound()); // Check before create
            FakeServer.respondOnce(containerUrl, FakeResponse.created()); // Create
            FakeServer.respondOnce(
                // Read described-by header
                containerUrl,
                FakeResponse.success('<> a <http://www.w3.org/ns/ldp#Container> .'),
            );
            FakeServer.respondOnce(`${containerUrl}.meta`, FakeResponse.success()); // Update meta
        } else {
            FakeServer.respondOnce(documentUrl, FakeResponse.notFound()); // Tombstone check
        }

        FakeServer.respondOnce(typeIndexUrl, typeIndexResponse()); // Check before update
        FakeServer.respondOnce(typeIndexUrl, FakeResponse.success()); // Update

        FakeServer.respondOnce(documentUrl, FakeResponse.notFound()); // Existence check
        FakeServer.respondOnce(documentUrl, FakeResponse.success()); // Create

        // Arrange - Prepare service
        if (!usingContainers) {
            Cloud.modelCollections[Movie.modelName] = [containerUrl];
        }

        Cloud.autoPush = false;

        await Cloud.launch();
        await registerModels();
        await Events.emit('application-ready');

        // Arrange - Initial sync
        await Cloud.sync();

        // Arrange - Sync responses
        FakeServer.respond(documentUrl, tombstoneResponse());

        // Act
        await movie.update({ name: 'Updated' });
        await Cloud.sync([movie]); // Simulate auto push

        // Assert
        expect(await Movie.at(containerUrl).find(movie.url)).toBeNull();

        if (usingContainers) {
            const freshContainer = await container.fresh();

            await freshContainer.loadRelation('movies');

            expect(freshContainer.movies).toHaveLength(0);
            expect(freshContainer.resourceUrls).toHaveLength(1);

            expect(FakeServer.getRequests(typeIndexUrl)).toHaveLength(3);
            expect(FakeServer.getRequests(containerUrl)).toHaveLength(4);
            expect(FakeServer.getRequests(documentUrl)).toHaveLength(4);
            expect(FakeServer.getRequests(`${containerUrl}.meta`)).toHaveLength(1);
            expect(FakeServer.getRequests()).toHaveLength(12);
        } else {
            expect(FakeServer.getRequests(typeIndexUrl)).toHaveLength(3);
            expect(FakeServer.getRequests(documentUrl)).toHaveLength(5);
            expect(FakeServer.getRequests()).toHaveLength(8);
        }

        expect(Cloud.localModelUpdates).toEqual({});
    });

    testRegisterVariants('Tracks model updates', async (registerModels) => {
        // Arrange
        const container = await MoviesContainer.create({ name: 'Movies' });
        const movie = await container.relatedMovies.create({ name: 'The Boy and The Heron' });

        await registerModels();

        Cloud.ready = true;

        // Act
        await movie.update({ releaseDate: new Date('2023-07-14') });
        await container.relatedMovies.create({ name: 'The Tale of Princess Kaguya' });

        // Assert
        expect(Cloud.localChanges).toEqual(2);
    });

});
