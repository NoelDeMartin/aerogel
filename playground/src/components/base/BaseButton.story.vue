<template>
    <Story group="base" :layout="{ type: 'grid' }">
        <Variant title="Playground">
            <BaseButton :color="color" :small="small" :icon="icon !== 'none'">
                <i-mdi-check v-if="icon === 'check'" :class="small ? 'h-4 w-4' : 'h-6 w-6'" />
                <i-mdi-close v-else-if="icon === 'close'" :class="small ? 'h-4 w-4' : 'h-6 w-6'" />
                <i-mdi-help-circle-outline v-else-if="icon === 'help'" :class="small ? 'h-4 w-4' : 'h-6 w-6'" />
                <span v-else>{{ content }}</span>
            </BaseButton>

            <template #controls>
                <HstText v-model="content" title="Content" />
                <HstCheckbox v-model="small" title="Small" />
                <HstSelect v-model="icon" title="Icon" :options="iconOptions" />
                <HstSelect v-model="color" title="Color" :options="colorOptions" />
            </template>
        </Variant>

        <Variant title="Default">
            <BaseButton> Click me! </BaseButton>
        </Variant>

        <Variant title="Hover">
            <BaseButton class=":hover">
                Click me!
            </BaseButton>
        </Variant>

        <Variant title="Focus">
            <BaseButton class=":focus :focus-visible">
                Click me!
            </BaseButton>
        </Variant>

        <Variant title="Disabled">
            <BaseButton disabled>
                You can't click me
            </BaseButton>
        </Variant>

        <Variant title="Colors" :layout="{ width: '300px' }">
            <div class="flex items-center gap-2">
                <BaseButton color="primary">
                    Primary
                </BaseButton>
                <BaseButton color="secondary">
                    Secondary
                </BaseButton>
                <BaseButton color="danger">
                    Danger
                </BaseButton>
                <BaseButton color="clear">
                    Clear
                </BaseButton>
            </div>
        </Variant>

        <Variant title="Sizes">
            <div class="flex items-center gap-2 p-1">
                <BaseButton>Default</BaseButton>
                <BaseButton small>
                    Small
                </BaseButton>
            </div>
        </Variant>

        <Variant title="Icons">
            <div class="flex items-center gap-2 p-1">
                <BaseButton icon>
                    <i-mdi-check class="h-6 w-6" />
                </BaseButton>
                <BaseButton icon>
                    <i-mdi-close class="h-6 w-6" />
                </BaseButton>
                <BaseButton icon>
                    <i-mdi-help-circle-outline class="h-6 w-6" />
                </BaseButton>
            </div>
        </Variant>

        <Variant title="Text + Icons">
            <div class="flex items-center gap-2 p-1">
                <BaseButton>
                    <i-mdi-check class="h-6 w-6" />
                    Complete
                </BaseButton>
                <BaseButton color="danger">
                    <i-mdi-alert class="h-4 w-4" />
                    Danger
                    <i-mdi-alert class="h-4 w-4" />
                </BaseButton>
                <BaseButton color="clear">
                    Log out
                    <i-mdi-login class="h-6 w-6" />
                </BaseButton>
            </div>
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import { Colors } from '@aerogel/core';
import { invert } from '@noeldemartin/utils';
import { ref } from 'vue';
import type { Color } from '@aerogel/core';

const Icons = {
    None: 'none',
    Check: 'check',
    Close: 'close',
    Help: 'help',
} as const;

export type Icon = (typeof Icons)[keyof typeof Icons];

const content = ref('Click me!');
const small = ref(false);
const icon = ref<Icon>(Icons.None);
const iconOptions = invert(Icons);
const color = ref<Color>(Colors.Primary);
const colorOptions = invert(Colors);
</script>

<style>
.story-basebutton {
    grid-template-columns: repeat(2, 300px) !important;
}

.story-basebutton .variant-playground,
.story-basebutton .variant-colors,
.story-basebutton .variant-sizes,
.story-basebutton .variant-icons,
.story-basebutton .variant-text-icons {
    grid-column: 1 / -1;
}
</style>
