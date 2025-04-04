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
            <Button small @click="$cloud.sync()">
                {{ $t('cloud.sync') }}
                <i-mdi-reload class="size-4" />
            </Button>
            <Button small color="clear" @click="$solid.logout()">
                {{ $t('solid.logout') }}
                <i-mdi-logout class="size-4" />
            </Button>
        </div>
    </span>
</template>
