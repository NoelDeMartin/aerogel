<template>
    <AGAppLayout class="bg-gray-100">
        <AppHeader />
        <main class="flex grow p-4">
            <div class="mx-auto flex w-full max-w-(--breakpoint-lg) grow flex-col">
                <RouterView />
            </div>
        </main>
        <AppFooter />
    </AGAppLayout>
</template>
