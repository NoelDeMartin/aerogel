<template>
    <footer class="bg-gray-200 p-2">
        <div class="m-auto flex max-w-(--breakpoint-lg) flex-row items-center justify-center gap-2">
            <Link class="text-sm text-gray-700" href="https://aerogel.js.org">
                {{ $t('footer.about') }}
            </Link>
            <span class="text-gray-600">|</span>
            <Link class="text-sm text-gray-700" href="https://github.com/NoelDeMartin/aerogel/tree/main/playground">
                {{ $t('footer.source') }}
            </Link>
        </div>
    </footer>
</template>
