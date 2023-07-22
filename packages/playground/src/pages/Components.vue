<template>
    <PageTitle source="src/pages/Components.vue">
        {{ $t('components.title') }}
    </PageTitle>

    <div class="prose-sm">
        <h2>{{ $t('components.buttons') }}</h2>
        <div class="mt-4 flex gap-2">
            <AppButton>
                {{ $t('components.buttons_custom') }}
            </AppButton>
            <AGButton>
                {{ $t('components.buttons_default') }}
            </AGButton>
        </div>

        <h2>{{ $t('components.inputs') }}</h2>
        <div class="mt-4 flex gap-2">
            <AppInput
                :label="$t('components.inputs_customLabel')"
                :placeholder="$t('components.inputs_customPlaceholder')"
            />
            <label>
                {{ $t('components.inputs_defaultLabel') }}
                <AGInput :placeholder="$t('components.inputs_defaultPlaceholder')" />
            </label>
        </div>
    </div>
</template>
