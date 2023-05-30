<template>
    <h2 class="text-xl">
        Welcome to Aerogel!
    </h2>

    <p class="mt-4">
        Here's some things to you can do:
    </p>

    <ul class="mt-2">
        <li>
            <RouterLink
                :to="{ name: 'persistence' }"
                class="flex h-32 w-32 items-center justify-center rounded-lg bg-blue-200 font-semibold hover:bg-blue-300"
            >
                Persistence
            </RouterLink>
        </li>
    </ul>
</template>
