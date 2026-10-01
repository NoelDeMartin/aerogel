<template>
    <header class="relative border-b border-b-blue-200 bg-blue-100 p-8">
        <div class="m-auto max-w-(--breakpoint-lg) text-center">
            <h1 class="text-2xl font-medium">
                <RouterLink :to="{ name: 'home' }">
                    <i-noto-test-tube class="inline size-6" /> {{ $t('app.title') }}
                </RouterLink>
            </h1>
            <ErrorLogs class="absolute top-1/2 right-2 -translate-y-1/2" />
        </div>
    </header>
</template>
