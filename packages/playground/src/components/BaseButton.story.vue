<template>
    <Story group="base" :layout="{ type: 'grid' }">
        <Variant title="Playground">
            <BaseButton class="m-1" :color="color" :small="small">
                {{ content }}
            </BaseButton>

            <template #controls>
                <HstText v-model="content" title="Content" />
                <HstCheckbox v-model="small" title="Small" />
                <HstSelect v-model="color" title="Color" :options="colorOptions" />
            </template>
        </Variant>

        <Variant title="Default">
            <BaseButton class="m-1">
                Click me!
            </BaseButton>
        </Variant>

        <Variant title="Hover">
            <BaseButton class=":hover m-1">
                Click me!
            </BaseButton>
        </Variant>

        <Variant title="Focus">
            <BaseButton class=":focus :focus-visible m-1">
                Click me!
            </BaseButton>
        </Variant>

        <Variant title="Sizes">
            <div class="flex items-center gap-2 p-1">
                <BaseButton small>
                    Small
                </BaseButton>
                <BaseButton>Default</BaseButton>
            </div>
        </Variant>

        <Variant title="Colors" :layout="{ width: '300px' }">
            <div class="flex items-center gap-2 p-1">
                <BaseButton color="primary">
                    Primary
                </BaseButton>
                <BaseButton color="danger">
                    Danger
                </BaseButton>
            </div>
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import { invert } from '@noeldemartin/utils';
import { ref } from 'vue';

import { Colors } from '@/components';

const content = ref('Click me!');
const small = ref(false);
const color = ref(Colors.Primary);
const colorOptions = invert(Colors);
</script>

<style>
.story-basebutton {
    grid-template-columns: repeat(3, 200px) !important;
}

.story-basebutton .variant-playground,
.story-basebutton .variant-sizes,
.story-basebutton .variant-colors {
    grid-column: 1 / -1;
}
</style>
