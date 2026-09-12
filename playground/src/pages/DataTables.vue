<template>
    <PageTitle source="src/pages/DataTables.vue">
        {{ $t('datatables.title') }}
    </PageTitle>
    <Table items-name="people">
        <TableColumn label="Name" field="name" />
        <TableColumn label="Age" field="age" sortable />
        <TableColumn label="Email" field="email" sortable>
            <template #default="{ item: person }">
                <a v-if="person.email" :href="`mailto:${person.email}`">{{ person.email }}</a>
                <span v-else>No email</span>
            </template>
        </TableColumn>
    </Table>
</template>

<script setup lang="ts">
import { useDataTable } from '@aerogel/core';
import { range } from '@noeldemartin/utils';

const { Table, TableColumn } = useDataTable([
    { name: 'John Doe', age: 20 },
    { name: 'Jane Doe', age: 21 },
    { name: 'John Smith', age: 22, email: 'john.smith@example.com' },
    { name: 'Jane Smith', age: 23, email: 'jane.smith@example.com' },
    ...range(100).map((index) => ({
        name: `Person ${index + 1}`,
        age: index + 1,
        email: `person${index + 1}@example.com`,
    })),
]);
</script>
