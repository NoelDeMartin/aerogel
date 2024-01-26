<template>
    <AGModal v-slot="{ close }: IAGModalDefaultSlotProps" :cancellable="false" :title="title">
        <AGMarkdown :text="message" />

        <AGForm :form="form" @submit="close(form.draft)">
            <AGInput name="draft" :placeholder="placeholder" :label="label" />

            <div class="mt-2 flex flex-row-reverse gap-2">
                <AGButton submit>
                    {{ renderedAcceptText }}
                </AGButton>
                <AGButton color="secondary" @click="close()">
                    {{ renderedCancelText }}
                </AGButton>
            </div>
        </AGForm>
    </AGModal>
</template>

<script setup lang="ts">
import AGModal from './AGModal.vue';
import { usePromptModal, usePromptModalProps } from './AGPromptModal';
import type { IAGModalDefaultSlotProps } from './AGModal';

import AGButton from '../forms/AGButton.vue';
import AGForm from '../forms/AGForm.vue';
import AGInput from '../forms/AGInput.vue';
import AGMarkdown from '../lib/AGMarkdown.vue';
import { requiredStringInput, useForm } from '../../forms';

const props = defineProps(usePromptModalProps());
const form = useForm({ draft: requiredStringInput(props.defaultValue ?? '') });
const { renderedAcceptText, renderedCancelText } = usePromptModal(props);
</script>
