<template>
    <PageTitle>{{ $t('home.title') }}</PageTitle>
    <AGMarkdown lang-key="home.description" />
    <ul class="mt-2 flex flex-row gap-3">
        <li v-for="section of sections" :key="section.route">
            <RouterLink
                :to="{ name: section.route }"
                class="flex h-32 w-32 items-center justify-center rounded-lg bg-blue-200 text-center font-semibold hover:bg-blue-300"
            >
                {{ $t(section.langKey) }}
            </RouterLink>
        </li>
    </ul>
</template>

<script setup lang="ts">
interface Section {
    langKey: string;
    route: string;
}

const sections: Section[] = [
    {
        langKey: 'home.content',
        route: 'content',
    },
    {
        langKey: 'home.forms',
        route: 'forms',
    },
    {
        langKey: 'home.modals',
        route: 'modals',
    },
    {
        langKey: 'home.storage',
        route: 'storage',
    },
];
</script>
