<template>
    <header class="relative border-b border-b-blue-200 bg-blue-100 p-8">
        <div class="max-w-(--breakpoint-lg) m-auto text-center">
            <h1 class="text-2xl font-medium">
                <RouterLink :to="{ name: 'home' }">
                    <i-noto-test-tube class="inline size-6" /> {{ $t('app.title') }}
                </RouterLink>
            </h1>
            <ErrorLogs class="absolute right-2 top-1/2 -translate-y-1/2" />
        </div>
    </header>
</template>
