<template>
    <SolidLogin v-if="$cloud.disconnected" />
    <AGMarkdown v-else-if="$cloud.syncing" lang-key="cloud.syncing" />
    <span v-else>
        <AGMarkdown
            :text="
                $t('solid.welcome', {
                    name: $solid.user?.name ?? $solid.user?.webId,
                    url: $solid.user?.webId,
                })
            "
        />
        <div class="mt-1 flex gap-2">
            <BaseButton small @click="$cloud.sync()">
                {{ $t('cloud.sync') }}
                <i-mdi-reload class="h-4 w-4" />
            </BaseButton>
            <BaseButton small color="clear" @click="$solid.logout()">
                {{ $t('solid.logout') }}
                <i-mdi-logout class="h-4 w-4" />
            </BaseButton>
        </div>
    </span>
</template>
