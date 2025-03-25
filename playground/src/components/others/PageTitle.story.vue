<template>
    <Story :layout="{ type: 'grid' }">
        <Variant title="Primary">
            <AGStoryPage>
                <PageTitle :source="viewSource ? '#' : undefined">
                    {{ content }}
                </PageTitle>
                <AGStoryPlaceholder class="h-96" />
            </AGStoryPage>

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
const viewSource = ref(true);
</script>

<style>
.story-pagetitle {
    grid-template-columns: auto !important;
}
</style>
