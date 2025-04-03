<template>
    <div>
        <AGMarkdown
            :text="
                $t('solid.welcome', {
                    name: $solid.user?.name ?? $solid.user?.webId,
                    url: $solid.user?.webId,
                })
            "
        />

        <BaseButton
            small
            color="clear"
            class="mt-1"
            @click="$solid.logout()"
        >
            {{ $t('solid.logout') }}
            <i-mdi-logout class="size-4" />
        </BaseButton>
    </div>
</template>
