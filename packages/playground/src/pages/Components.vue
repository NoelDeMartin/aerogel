<template>
    <PageTitle source="src/pages/Components.vue">
        {{ $t('components.title') }}
    </PageTitle>

    <div class="prose-sm">
        <h2>{{ $t('components.buttons') }}</h2>
        <div class="mt-4 flex items-center gap-2">
            <span>{{ $t('components.buttons_custom') }}:</span>
            <BaseButton>
                {{ $t('components.buttons_clickMe') }}
            </BaseButton>
            <BaseButton color="danger">
                {{ $t('components.buttons_clickMe') }}
            </BaseButton>
            <BaseButton color="clear">
                {{ $t('components.buttons_clickMe') }}
            </BaseButton>
        </div>
        <div class="mt-4 flex items-center gap-2">
            <span>{{ $t('components.buttons_customWithIcons') }}:</span>
            <BaseButton icon>
                <i-mdi-check class="h-6 w-6" aria-hidden="true" />
            </BaseButton>
            <BaseButton icon color="danger">
                <i-mdi-close class="h-6 w-6" aria-hidden="true" />
            </BaseButton>
            <BaseButton icon color="clear">
                <i-mdi-help-circle-outline class="h-6 w-6" aria-hidden="true" />
            </BaseButton>
        </div>
        <div class="mt-4 flex items-center gap-2">
            <span>{{ $t('components.buttons_default') }}:</span>
            <AGButton>
                {{ $t('components.buttons_clickMe') }}
            </AGButton>
            <AGButton secondary>
                {{ $t('components.buttons_clickMe') }}
            </AGButton>
            <AGButton clear>
                <i-mdi-help-circle-outline class="h-6 w-6" aria-hidden="true" />
            </AGButton>
        </div>

        <h2>{{ $t('components.inputs') }}</h2>
        <div class="mt-4 flex gap-2">
            <BaseInput
                :label="$t('components.inputs_customLabel')"
                :placeholder="$t('components.inputs_customPlaceholder')"
            />
            <label>
                {{ $t('components.inputs_defaultLabel') }}
                <AGInput :placeholder="$t('components.inputs_defaultPlaceholder')" class="mt-1" />
            </label>
        </div>

        <h2>{{ $t('components.checkboxes') }}</h2>
        <BaseCheckbox>{{ $t('components.checkboxes_custom') }}</BaseCheckbox>
        <AGCheckbox>{{ $t('components.checkboxes_default') }}</AGCheckbox>

        <h2>{{ $t('components.modals') }}</h2>
        <div class="mt-4 flex gap-2">
            <BaseButton @click="$ui.alert($t('components.modals_alertTitle'), $t('components.modals_alertMessage'))">
                {{ $t('components.modals_customAlert') }}
            </BaseButton>
            <BaseButton
                @click="
                    $ui.openModal(AGAlertModal, {
                        title: $t('components.modals_alertTitle'),
                        message: $t('components.modals_alertMessage'),
                    })
                "
            >
                {{ $t('components.modals_defaultAlert') }}
            </BaseButton>
        </div>
    </div>
    <div class="mt-4 flex gap-2">
        <BaseButton @click="$ui.confirm($t('components.modals_confirmMessage'))">
            {{ $t('components.modals_customConfirm') }}
        </BaseButton>
        <BaseButton
            @click="
                $ui.openModal(AGConfirmModal, {
                    message: $t('components.modals_confirmMessage'),
                })
            "
        >
            {{ $t('components.modals_defaultConfirm') }}
        </BaseButton>
    </div>
</template>

<script setup lang="ts">
import { AGAlertModal, AGConfirmModal } from '@aerogel/core';
</script>
