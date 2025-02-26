import { beforeEach, describe, expect, it } from 'vitest';
import { Events } from '@aerogel/core';
import { fakeContainerUrl, fakeDocumentUrl } from '@noeldemartin/testing';
import { FakeResponse, range, round } from '@noeldemartin/utils';
import { Solid } from '@aerogel/plugin-solid';

import Cloud from '@/services/Cloud';
import { getRemoteClass } from '@/lib/mirroring';

import Workspace from '@/testing/stubs/Workspace';
import SolidMock from '@/testing/mocks/Solid.mock';
import LegacyTaskSchema from '@/testing/stubs/LegacyTask.schema';
import TaskSchema from '@/testing/stubs/Task.schema';
import Task from '@/testing/stubs/Task';
import { legacyTaskResponse, setupCloudTests, typeIndexResponse } from '@/testing/cloud';

describe('Migrate', () => {

    beforeEach(setupCloudTests);

    it('Migrates containers', async () => {
        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0];
        const containerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const documentUrl = fakeDocumentUrl({ containerUrl });

        // Arrange - Prepare models
        await Task.updateSchema(LegacyTaskSchema);

        const workspace = await Workspace.at(parentContainerUrl).create({
            url: containerUrl,
            name: 'Tasks',
        });

        await workspace.relatedTasks.create({
            url: `${documentUrl}#it`,
            name: 'Migrate schemas',
        });

        // Arrange - Prepare responses
        const server = SolidMock.server;
        const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';
        const typeIndex = typeIndexResponse({ [containerUrl]: '<http://www.w3.org/2002/12/cal/ical#Vtodo>' });

        server.respondOnce(typeIndexUrl, typeIndex);
        server.respondOnce(documentUrl, legacyTaskResponse('Migrate schemas'));
        server.respondOnce(documentUrl, legacyTaskResponse('Migrate schemas'));
        server.respondOnce(documentUrl, FakeResponse.success());
        server.respondOnce(typeIndexUrl, typeIndex);
        server.respondOnce(typeIndexUrl, FakeResponse.success());

        // Arrange - Prepare service
        Cloud.ready = true;

        await Cloud.launch();
        await Cloud.register(Workspace);
        await Events.emit('application-ready');

        // Arrange - Track progress
        const updates: number[] = [];

        // Act
        await Cloud.migrate([[Task, TaskSchema]], {
            onUpdated: (progress) => updates.push(progress),
        });

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
        // Arrange - Mint urls
        const parentContainerUrl = Solid.requireUser().storageUrls[0];
        const containerUrl = fakeContainerUrl({ baseUrl: parentContainerUrl });
        const documentUrls = range(5).map(() => fakeDocumentUrl({ containerUrl }));

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

        await Cloud.launch();
        await Cloud.register(Workspace);
        await Events.emit('application-ready');

        // Arrange - Track progress
        const updates: number[] = [];

        // Act
        await Cloud.migrate([[Task, TaskSchema]], {
            onUpdated: (progress) => updates.push(progress),
        });

        // Assert
        const step = 1 / documentUrls.length;

        expect(updates).toEqual([...documentUrls.map((_, index) => round(index * step, 2)), 1]);
    });

});
