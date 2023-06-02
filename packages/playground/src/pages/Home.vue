<template>
    <h2 class="text-xl">
        {{ $t('home.title') }}
    </h2>

    <p class="mt-4">
        {{ $t('home.description') }}
    </p>

    <ul class="mt-2">
        <li>
            <RouterLink
                :to="{ name: 'persistence' }"
                class="flex h-32 w-32 items-center justify-center rounded-lg bg-blue-200 font-semibold hover:bg-blue-300"
            >
                {{ $t('home.persistence') }}
            </RouterLink>
        </li>
    </ul>
</template>
