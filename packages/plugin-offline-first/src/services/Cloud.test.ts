import { beforeEach, describe, expect, it } from 'vitest';
import { fakeContainerUrl, fakeDocumentUrl } from '@noeldemartin/solid-utils';
import { FakeResponse, arrayFind } from '@noeldemartin/utils';
import { FieldType, InMemoryEngine, bootModels, setEngine } from 'soukai';
import { SolidContainer, bootSolidModels, defineSolidModelSchema } from 'soukai-solid';
import { SolidMock } from '@aerogel/plugin-solid';
import type { Relation } from 'soukai';

import Cloud, { CloudService } from './Cloud';

describe('Cloud', () => {

    beforeEach(() => {
        bootSolidModels();
        bootModels({ Movie, MoviesContainer });
        setEngine(new InMemoryEngine());

        Cloud.setInstance(new CloudService());
    });

    it('Syncs containers', async () => {
        // Arrange - Mint urls
        const parentContainerUrl = fakeContainerUrl();
        const remoteContainerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const localContainerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });

        // Arrange - Mock Solid
        const server = SolidMock.server;
        const typeIndex = SolidMock.setPrivateTypeIndex([
            {
                forClass: Movie.rdfsClasses,
                instanceContainer: remoteContainerUrl,
            },
        ]);

        SolidMock.init();

        server.respond(typeIndex.url, FakeResponse.success('<./> a <http://www.w3.org/ns/solid/terms#TypeIndex>.'));
        server.respond(
            remoteContainerUrl,
            FakeResponse.success(
                `
                    @prefix dc: <http://purl.org/dc/terms/>.
                    @prefix ldp: <http://www.w3.org/ns/ldp#>.
                    @prefix posix: <http://www.w3.org/ns/posix/stat#>.
                    @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
                    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.

                    <./> a ldp:Container, ldp:BasicContainer, ldp:Resource;
                        rdfs:label "Remote Movies";
                        dc:created "2024-02-05T12:28:42Z"^^xsd:dateTime;
                        dc:modified "2024-02-05T12:28:42Z"^^xsd:dateTime;
                        posix:mtime 1707136122.
                `,
            ),
        );

        server.respondOnce(localContainerUrl, FakeResponse.notFound()); // Tombstone check
        server.respondOnce(localContainerUrl, FakeResponse.notFound()); // Check before create
        server.respondOnce(localContainerUrl, FakeResponse.created()); // Create
        server.respondOnce(localContainerUrl, FakeResponse.success()); // Read described-by header
        server.respondOnce(`${localContainerUrl}.meta`, FakeResponse.success()); // Update meta

        // Arrange - Prepare models
        const localContainer = await MoviesContainer.at(parentContainerUrl).create({
            url: localContainerUrl,
            name: 'Local Movies',
        });

        await Cloud.launch();
        await Cloud.registerHandler({
            modelClass: MoviesContainer,
            registerFor: Movie,
            getLocalModels: () => [localContainer],
        });

        // Act
        await Cloud.sync();

        // Assert
        expect(server.getRequests(remoteContainerUrl)).toHaveLength(1);
        expect(server.getRequests(localContainerUrl)).toHaveLength(4);
        expect(server.getRequests(localContainerUrl + '.meta')).toHaveLength(1);
        expect(server.getRequests(typeIndex.url)).toHaveLength(2);
        expect(server.getRequests()).toHaveLength(8);
        expect(server.getRequest('PATCH', typeIndex.url)?.body).toEqualSparql(`
            INSERT DATA {
                <#[[.*]]>
                    a <http://www.w3.org/ns/solid/terms#TypeRegistration> ;
                    <http://www.w3.org/ns/solid/terms#forClass> <https://schema.org/Movie> ;
                    <http://www.w3.org/ns/solid/terms#instanceContainer> <${localContainerUrl}> .
            }
        `);

        const containers = await MoviesContainer.all();
        expect(containers).toHaveLength(2);
        expect(arrayFind(containers, 'name', 'Local Movies')).toBeInstanceOf(MoviesContainer);
        expect(arrayFind(containers, 'name', 'Remote Movies')).toBeInstanceOf(MoviesContainer);
    });

    it('Syncs documents', async () => {
        // Arrange - Mint urls
        const containerUrl = fakeContainerUrl();
        const remoteDocumentUrl = fakeDocumentUrl({ containerUrl });
        const localDocumentUrl = fakeDocumentUrl({ containerUrl });

        // Arrange - Mock Solid
        const server = SolidMock.server;

        SolidMock.setPrivateTypeIndex([
            {
                forClass: Movie.rdfsClasses,
                instanceContainer: containerUrl,
            },
        ]);

        SolidMock.init();

        server.respond(
            containerUrl,
            FakeResponse.success(
                `
                    @prefix dc: <http://purl.org/dc/terms/>.
                    @prefix ldp: <http://www.w3.org/ns/ldp#>.
                    @prefix posix: <http://www.w3.org/ns/posix/stat#>.
                    @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
                    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.

                    <./> a ldp:Container, ldp:BasicContainer, ldp:Resource;
                        rdfs:label "Movies";
                        dc:created "2024-02-05T12:28:42Z"^^xsd:dateTime;
                        dc:modified "2024-02-05T12:28:42Z"^^xsd:dateTime;
                        ldp:contains <${remoteDocumentUrl}>;
                        posix:mtime 1707136122.
                `,
            ),
        );
        server.respond(
            remoteDocumentUrl,
            FakeResponse.success(
                `
                    @prefix schema: <https://schema.org/>.
                    @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
                    @prefix crdt: <https://vocab.noeldemartin.com/crdt/> .

                    <#it>
                        a schema:Movie;
                        schema:datePublished "2001-07-20T00:00:00Z"^^xsd:dateTime;
                        schema:name "Spirited Away".

                    <#it-metadata> a crdt:Metadata;
                        crdt:resource <#it>;
                        crdt:createdAt "2024-02-10T00:00:00Z"^^xsd:dateTime;
                        crdt:updatedAt "2024-02-10T00:00:00Z"^^xsd:dateTime.
                `,
            ),
        );

        server.respondOnce(localDocumentUrl, FakeResponse.notFound()); // Tombstone check
        server.respondOnce(localDocumentUrl, FakeResponse.notFound()); // Check before create
        server.respondOnce(localDocumentUrl, FakeResponse.created()); // Create

        // Arrange - Prepare models
        const localMovie = await Movie.at(containerUrl).create({
            url: `${localDocumentUrl}#it`,
            name: 'The Tale of Princess Kaguya',
        });

        await Cloud.launch();
        await Cloud.registerHandler({
            modelClass: Movie,
            getLocalModels: () => [localMovie],
        });

        // Act
        try {
            await Cloud.sync();
        } catch (error) {
            error;
        }

        // Assert
        expect(server.getRequests(containerUrl)).toHaveLength(1);
        expect(server.getRequests(localDocumentUrl)).toHaveLength(3);
        expect(server.getRequests(remoteDocumentUrl)).toHaveLength(1);
        expect(server.getRequests()).toHaveLength(5);

        const movies = await Movie.all();
        expect(movies).toHaveLength(2);
        expect(arrayFind(movies, 'name', 'The Tale of Princess Kaguya')).toBeInstanceOf(Movie);
        expect(arrayFind(movies, 'name', 'Spirited Away')).toBeInstanceOf(Movie);
    });

});

const MovieSchema = defineSolidModelSchema({
    rdfContext: 'https://schema.org/',
    fields: {
        name: FieldType.String,
    },
});

class Movie extends MovieSchema {}

class MoviesContainer extends SolidContainer {

    public moviesRelationship(): Relation {
        return this.contains(Movie);
    }

}
