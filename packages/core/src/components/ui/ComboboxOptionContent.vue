<template>
    <div class="p-1">
        <div
            class="relative flex max-w-[calc(100vw-2rem)] cursor-pointer select-none items-center gap-2 truncate rounded-md px-2 py-1 text-sm *:truncate group-data-[highlighted]:bg-gray-100 group-data-[state=checked]:font-semibold group-data-[state=unchecked]:opacity-50"
        >
            <slot />
        </div>
    </div>
</template>
