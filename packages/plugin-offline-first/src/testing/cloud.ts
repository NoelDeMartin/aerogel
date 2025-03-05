import { App } from '@aerogel/core';
import { bootSolidModels } from 'soukai-solid';
import { FakeResponse, fail, mock, required, uuid } from '@noeldemartin/utils';
import { InMemoryEngine, bootModels, resetModelListeners, setEngine } from 'soukai';
import { it } from 'vitest';
import { resetTrackedModels } from '@aerogel/plugin-soukai';
import { Solid } from '@aerogel/plugin-solid';
import type { App as AppInstance } from 'vue';

import Cloud from '@/services/Cloud';

import Movie from '@/testing/stubs/Movie';
import MoviesContainer from '@/testing/stubs/MoviesContainer';
import SolidMock from '@/testing/mocks/Solid.mock';
import Task from '@/testing/stubs/Task';
import TaskSchema from '@/testing/stubs/Task.schema';
import TasksList from '@/testing/stubs/TasksList';
import Workspace from '@/testing/stubs/Workspace';

export async function setupCloudTests(): Promise<void> {
    bootSolidModels();
    bootModels({ Movie, MoviesContainer, Task, TasksList, Workspace });
    setEngine(new InMemoryEngine());
    resetTrackedModels();
    resetModelListeners();

    await Task.updateSchema(TaskSchema);

    App.instance = mock<AppInstance>({ config: { globalProperties: { $cloud: Cloud } } });

    Solid.mock();
    Cloud.reset();
}

export function testVariants<T, Variants extends Record<string, T>>(
    description: string,
    variants: Variants,
    test: (variantData: T, variantName: keyof Variants) => unknown,
    options: { only?: boolean | keyof Variants } = {},
): void {
    if (typeof options.only === 'string') {
        const name = options.only;
        const data = variants[name] ?? fail<T>();

        it.only(`[${name}] ${description}`, () => test(data, name));

        return;
    }

    if (options.only) {
        const [name, data] = required(Object.entries(variants)[0]);

        it.only(`[${name}] ${description}`, () => test(data, name));

        return;
    }

    for (const [name, data] of Object.entries(variants)) {
        it(`[${name}] ${description}`, () => test(data, name));
    }
}

export function testRegisterVariants(
    description: string,
    test: (registerModels: () => unknown, variant: 'model registration' | 'container registration') => unknown,
    options: { only?: boolean | 'model registration' | 'container registration' } = {},
): void {
    testVariants(
        description,
        {
            'model registration': () => Cloud.register(Movie),
            'container registration': () => Cloud.register(MoviesContainer),
        },
        test,
        options,
    );
}

export function typeIndexResponse(containers?: Record<string, string>): Response {
    const typeIndexUrl = SolidMock.requireUser().privateTypeIndexUrl ?? '';
    const registrations = Object.entries(containers ?? []).map(
        ([containerUrl, forClass]) => `
            <#${uuid()}>
                a solid:TypeRegistration ;
                solid:forClass ${forClass} ;
                solid:instanceContainer <${containerUrl}> .
        `,
    );

    return FakeResponse.success(`
        @prefix solid: <http://www.w3.org/ns/solid/terms#>.

        <${typeIndexUrl}> a solid:TypeIndex .

        ${registrations.join('\n')}
    `);
}

export function containerResponse(
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

export function movieResponse(title: string): Response {
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

export function taskResponse(name?: string): Response {
    return FakeResponse.success(`
        @prefix schema: <https://schema.org/>.
        @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
        @prefix crdt: <https://vocab.noeldemartin.com/crdt/> .

        <#it>
            a schema:Action;
            schema:name "${name ?? 'Task'}".

        <#it-metadata> a crdt:Metadata;
            crdt:resource <#it>;
            crdt:createdAt "2024-02-10T00:00:00Z"^^xsd:dateTime;
            crdt:updatedAt "2024-02-10T00:00:00Z"^^xsd:dateTime.
    `);
}

export function legacyTaskResponse(name?: string): Response {
    return FakeResponse.success(`
        @prefix ical: <http://www.w3.org/2002/12/cal/ical#>.
        @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
        @prefix crdt: <https://vocab.noeldemartin.com/crdt/> .

        <#it>
            a ical:Vtodo;
            ical:summary "${name ?? 'Task'}".

        <#it-metadata> a crdt:Metadata;
            crdt:resource <#it>;
            crdt:createdAt "2024-02-10T00:00:00Z"^^xsd:dateTime;
            crdt:updatedAt "2024-02-10T00:00:00Z"^^xsd:dateTime.
    `);
}
