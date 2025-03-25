import { beforeEach, describe, expect, it } from 'vitest';
import { Events } from '@aerogel/core';
import { FakeServer, fakeContainerUrl, fakeDocumentUrl } from '@noeldemartin/testing';
import { range } from '@noeldemartin/utils';
import { Solid } from '@aerogel/plugin-solid';

import Cloud from '@aerogel/plugin-local-first/services/Cloud';
import { getRemoteClass } from '@aerogel/plugin-local-first/lib/mirroring';

import Workspace from '@aerogel/plugin-local-first/testing/stubs/Workspace';
import SolidMock from '@aerogel/plugin-local-first/testing/mocks/Solid.mock';
import LegacyTaskSchema from '@aerogel/plugin-local-first/testing/stubs/LegacyTask.schema';
import TaskSchema from '@aerogel/plugin-local-first/testing/stubs/Task.schema';
import Task from '@aerogel/plugin-local-first/testing/stubs/Task';
import { legacyTaskResponse, setupCloudTests, typeIndexResponse } from '@aerogel/plugin-local-first/testing/cloud';

import Migrate from './Migrate';

describe('Migrate', () => {

    beforeEach(setupCloudTests);

    it('Migrates containers', async () => {
        // Arrange
        const updates: number[] = [];
        const {
            workspace,
            typeIndexUrl,
            documentUrls: [documentUrl],
        } = await setupMigration(1);

        // Act
        await Cloud.migrate({ onUpdated: (progress) => updates.push(progress) });

        // Assert - Progress
        expect(updates).toEqual([0, 1]);

        // Assert - Local models
        expect(Task.rdfsClasses).toEqual(['https://schema.org/Action']);

        const freshWorkspace = await workspace.fresh();

        await freshWorkspace.loadRelation('tasks');

        expect(freshWorkspace.tasks).toHaveLength(1);

        // Assert - Remote models
        expect(getRemoteClass(Task).rdfsClasses).toEqual(['https://schema.org/Action']);

        expect(FakeServer.getRequests(documentUrl)).toHaveLength(3);
        expect(FakeServer.getRequests(typeIndexUrl)).toHaveLength(3);
        expect(FakeServer.getRequests()).toHaveLength(6);

        expect(FakeServer.getRequest('PATCH', documentUrl)?.body).toEqualSparql(`
            DELETE DATA {
                @prefix ical: <http://www.w3.org/2002/12/cal/ical#>.

                <#it>
                    a ical:Vtodo ;
                    ical:summary "Migrate schemas" .
            } ;

            INSERT DATA {
                @prefix schema: <https://schema.org/>.

                <#it>
                    a schema:Action ;
                    schema:name "Migrate schemas" .
            } .
        `);

        expect(FakeServer.getRequest('PATCH', typeIndexUrl)?.body).toEqualSparql(`
            DELETE DATA {
                @prefix solid: <http://www.w3.org/ns/solid/terms#>.
                @prefix ical: <http://www.w3.org/2002/12/cal/ical#>.

                <#[[registration][.*]]> solid:forClass ical:Vtodo .
            } ;

            INSERT DATA {
                @prefix solid: <http://www.w3.org/ns/solid/terms#>.
                @prefix schema: <https://schema.org/>.

                <#[[registration][.*]]> solid:forClass schema:Action .
            } .
        `);
    });

    it('Tracks progress', async () => {
        // Arrange
        const updates: number[] = [];

        await setupMigration(5);

        // Act
        await Cloud.migrate({ onUpdated: (progress) => updates.push(progress) });

        // Assert
        expect(updates).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    });

    it('Resumes after cancellation', async () => {
        // Arrange
        const updates: number[] = [];

        await setupMigration(5);

        // Act - Cancel
        await Cloud.migrate({
            onUpdated: (progress) => {
                updates.push(progress);

                if (progress > 0.5) {
                    Cloud.migrationJob?.cancel();
                }
            },
        });

        // Assert - Cancel
        const job = Cloud.migrationJob;

        expect(job?.cancelled).toBe(true);
        expect(updates).toEqual([0, 0.2, 0.4, 0.6]);

        // Act - Resume
        await Cloud.migrate({ onUpdated: (progress) => updates.push(progress) });

        // Assert - Resume
        expect(job?.cancelled).toBe(false);
        expect(Cloud.migrationJob).toBe(null);
        expect(updates).toEqual([0, 0.2, 0.4, 0.6, 0.6, 0.8, 1]);
    });

    it('Resumes after going through serialization', async () => {
        // Arrange
        const updates: number[] = [];

        await setupMigration(5);

        // Act - Cancel and serialize
        await Cloud.migrate({
            onUpdated: (progress) => {
                updates.push(progress);

                if (progress > 0.5) {
                    Cloud.migrationJob?.cancel();
                }
            },
        });

        Cloud.migrationJob = Migrate.restore(JSON.parse(JSON.stringify(Cloud.migrationJob?.serialize())));

        // Assert - Cancel and serialize
        expect(Cloud.migrationJob?.models).toBeUndefined();
        expect(updates).toEqual([0, 0.2, 0.4, 0.6]);

        // Act - Resume
        await Cloud.migrate({
            onUpdated: (progress) => updates.push(progress),
        });

        // Assert - Resume
        expect(Cloud.migrationJob).toBe(null);
        expect(updates).toEqual([0, 0.2, 0.4, 0.6, 0.6, 0.8, 1]);
    });

});

async function setupMigration(count: number = 1) {
    // Arrange - Mint urls
    const parentContainerUrl = Solid.requireUser().storageUrls[0];
    const containerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
    const documentUrls = range(count).map(() => fakeDocumentUrl({ containerUrl })) as [string, ...string[]];

    // Arrange - Prepare models
    await Task.updateSchema(LegacyTaskSchema);

    const workspace = await Workspace.at(parentContainerUrl).create({
        url: containerUrl,
        name: 'Tasks',
    });

    for (const documentUrl of documentUrls) {
        await workspace.relatedTasks.create({
            url: `${documentUrl}#it`,
            name: 'Migrate schemas',
        });
    }

    // Arrange - Prepare responses
    const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';
    const typeIndex = typeIndexResponse({ [containerUrl]: '<http://www.w3.org/2002/12/cal/ical#Vtodo>' });

    FakeServer.respondOnce(typeIndexUrl, typeIndex);
    documentUrls.forEach((documentUrl) => {
        FakeServer.respondOnce(documentUrl, legacyTaskResponse('Migrate schemas'));
        FakeServer.respondOnce(documentUrl, legacyTaskResponse('Migrate schemas'));
        FakeServer.respondOnce(documentUrl);
    });
    FakeServer.respondOnce(typeIndexUrl, typeIndex);
    FakeServer.respondOnce(typeIndexUrl);

    // Arrange - Prepare service
    Cloud.ready = true;

    Cloud.registerSchemaMigration(Task, TaskSchema);

    await Cloud.launch();
    await Cloud.register(Workspace);
    await Events.emit('application-ready');

    return {
        workspace,
        typeIndexUrl,
        documentUrls,
    };
}
