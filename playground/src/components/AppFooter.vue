<template>
    <footer class="bg-gray-200 p-2">
        <div class="m-auto flex max-w-(--breakpoint-lg) flex-row items-center justify-center gap-2">
            <AppFooterLink href="https://aerogel.js.org">
                {{ $t('footer.about') }}
            </AppFooterLink>
            <span class="text-gray-600">|</span>
            <AppFooterLink href="https://github.com/NoelDeMartin/aerogel/tree/main/playground">
                {{ $t('footer.source') }}
            </AppFooterLink>
        </div>
    </footer>
</template>
