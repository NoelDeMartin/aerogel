<template>
    <header class="border-b bg-blue-100 p-8">
        <div class="m-auto max-w-screen-lg text-center">
            <h1 class="text-2xl font-medium">
                <RouterLink :to="{ name: 'home' }">
                    <i-noto-test-tube class="inline h-6 w-6" /> {{ $t('app.title') }}
                </RouterLink>
            </h1>
        </div>
    </header>
</template>
