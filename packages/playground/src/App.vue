<template>
    <AGAppLayout>
        <AppHeader />
        <main class="flex flex-grow bg-gray-100 p-4">
            <div class="mx-auto flex max-w-screen-lg flex-grow flex-col">
                <RouterView />
            </div>
        </main>
        <AppFooter />
    </AGAppLayout>
</template>
