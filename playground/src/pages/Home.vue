<template>
    <div class="flex grow flex-col items-center">
        <PageTitle>{{ $t('home.title') }}</PageTitle>
        <Markdown lang-key="home.description" class="text-center" />
        <ul class="mt-2 flex w-full max-w-prose flex-wrap justify-center gap-3">
            <li v-for="section of sections" :key="section.route">
                <RouterLink
                    :to="{ name: section.route }"
                    class="flex size-32 items-center justify-center rounded-lg bg-blue-200 text-center font-semibold hover:bg-blue-300"
                >
                    {{ $t(section.langKey) }}
                </RouterLink>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
interface Section {
    langKey: string;
    route: string;
}

const sections: Section[] = [
    {
        langKey: 'home.components',
        route: 'components',
    },
    {
        langKey: 'home.content',
        route: 'content',
    },
    {
        langKey: 'home.errors',
        route: 'errors',
    },
    {
        langKey: 'home.forms',
        route: 'forms',
    },
    {
        langKey: 'home.storage',
        route: 'storage',
    },
    {
        langKey: 'home.solid',
        route: 'solid',
    },
    {
        langKey: 'home.localFirst',
        route: 'local-first',
    },
];
</script>
