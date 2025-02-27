import { beforeEach, describe, expect, it } from 'vitest';
import { Events } from '@aerogel/core';
import { fakeContainerUrl, fakeDocumentUrl } from '@noeldemartin/testing';
import { FakeResponse, range } from '@noeldemartin/utils';
import { Solid } from '@aerogel/plugin-solid';

import Cloud from '@/services/Cloud';
import { getRemoteClass } from '@/lib/mirroring';

import Workspace from '@/testing/stubs/Workspace';
import SolidMock from '@/testing/mocks/Solid.mock';
import LegacyTaskSchema from '@/testing/stubs/LegacyTask.schema';
import TaskSchema from '@/testing/stubs/Task.schema';
import Task from '@/testing/stubs/Task';
import { legacyTaskResponse, setupCloudTests, typeIndexResponse } from '@/testing/cloud';

import Migrate from './Migrate';

describe('Migrate', () => {

    beforeEach(setupCloudTests);

    it('Migrates containers', async () => {
        // Arrange
        const updates: number[] = [];
        const {
            server,
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

        expect(server.getRequests(documentUrl)).toHaveLength(3);
        expect(server.getRequests(typeIndexUrl)).toHaveLength(3);
        expect(server.getRequests()).toHaveLength(6);

        expect(server.getRequest('PATCH', documentUrl)?.body).toEqualSparql(`
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

        expect(server.getRequest('PATCH', typeIndexUrl)?.body).toEqualSparql(`
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
    const server = SolidMock.server;
    const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';
    const typeIndex = typeIndexResponse({ [containerUrl]: '<http://www.w3.org/2002/12/cal/ical#Vtodo>' });

    server.respondOnce(typeIndexUrl, typeIndex);
    documentUrls.forEach((documentUrl) => {
        server.respondOnce(documentUrl, legacyTaskResponse('Migrate schemas'));
        server.respondOnce(documentUrl, legacyTaskResponse('Migrate schemas'));
        server.respondOnce(documentUrl, FakeResponse.success());
    });
    server.respondOnce(typeIndexUrl, typeIndex);
    server.respondOnce(typeIndexUrl, FakeResponse.success());

    // Arrange - Prepare service
    Cloud.ready = true;

    Cloud.registerSchemaMigration(Task, TaskSchema);

    await Cloud.launch();
    await Cloud.register(Workspace);
    await Events.emit('application-ready');

    return {
        server,
        workspace,
        typeIndexUrl,
        documentUrls,
    };
}
