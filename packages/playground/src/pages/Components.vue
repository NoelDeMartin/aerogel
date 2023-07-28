<template>
    <PageTitle source="src/pages/Components.vue">
        {{ $t('components.title') }}
    </PageTitle>

    <div class="prose-sm">
        <h2>{{ $t('components.buttons') }}</h2>
        <div class="mt-4 flex gap-2">
            <BaseButton>
                {{ $t('components.buttons_custom') }}
            </BaseButton>
            <AGButton>
                {{ $t('components.buttons_default') }}
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
                <AGInput :placeholder="$t('components.inputs_defaultPlaceholder')" />
            </label>
        </div>

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
