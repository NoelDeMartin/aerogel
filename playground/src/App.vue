<template>
    <AppLayout>
        <AppHeader />
        <main class="flex grow p-4">
            <div class="mx-auto flex w-full max-w-(--breakpoint-lg) grow flex-col">
                <RouterView />
            </div>
        </main>
        <AppFooter />
    </AppLayout>
</template>
