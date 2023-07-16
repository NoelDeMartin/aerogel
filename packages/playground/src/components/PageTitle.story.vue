<template>
    <Story>
        <Variant title="Primary">
            <PageTitle :source="viewSource ? '#' : undefined">
                {{ content }}
            </PageTitle>

            <template #controls>
                <HstText v-model="content" title="Content" />
                <HstCheckbox v-model="viewSource" title="View source" />
            </template>
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const content = ref('Your awesome title');
const viewSource = ref(false);
</script>
