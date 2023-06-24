<template>
    <AGAppLayout>
        <header class="border-b bg-blue-100 p-8">
            <div class="m-auto max-w-screen-lg text-center">
                <h1 class="text-2xl font-medium">
                    <RouterLink :to="{ name: 'home' }">
                        🧪 {{ $t('app.title') }}
                    </RouterLink>
                </h1>
            </div>
        </header>
        <main class="flex flex-grow bg-gray-100 p-4">
            <div class="mx-auto flex max-w-screen-lg flex-grow flex-col">
                <RouterView />
            </div>
        </main>
        <footer class="bg-gray-200 p-2">
            <div class="m-auto flex max-w-screen-lg flex-row items-center justify-center gap-2">
                <a
                    href="https://aerogel.js.org"
                    target="_blank"
                    class="text-sm text-gray-600 underline hover:text-gray-800"
                >
                    {{ $t('footer.about') }}
                </a>
                <span class="text-gray-600">|</span>
                <a
                    href="https://github.com/NoelDeMartin/aerogel/tree/main/packages/playground"
                    target="_blank"
                    class="text-sm text-gray-600 underline hover:text-gray-800"
                >
                    {{ $t('footer.source') }}
                </a>
            </div>
        </footer>
    </AGAppLayout>
</template>
