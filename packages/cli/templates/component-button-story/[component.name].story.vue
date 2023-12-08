<template>
    <Story :layout="{ type: 'grid' }">
        <Variant title="Playground">
            <<% component.name %> :color="color">
                {{ content }}
            </<% component.name %>>

            <template #controls>
                <HstText v-model="content" title="Content" />
                <HstSelect v-model="color" title="Color" :options="colorOptions" />
            </template>
        </Variant>

        <Variant title="Default">
            <<% component.name %>>
                Click me!
            </<% component.name %>>
        </Variant>

        <Variant title="Hover">
            <<% component.name %> class=":hover">
                Click me!
            </<% component.name %>>
        </Variant>

        <Variant title="Focus">
            <<% component.name %> class=":focus :focus-visible">
                Click me!
            </<% component.name %>>
        </Variant>

        <Variant title="Disabled">
            <<% component.name %> disabled>
                You can't click me
            </<% component.name %>>
        </Variant>

        <Variant title="Colors" :layout="{ width: '300px' }">
            <div class="flex items-center gap-2">
                <<% component.name %> color="primary">
                    Primary
                </<% component.name %>>
                <<% component.name %> color="secondary">
                    Secondary
                </<% component.name %>>
                <<% component.name %> color="danger">
                    Danger
                </<% component.name %>>
                <<% component.name %> color="clear">
                    Clear
                </<% component.name %>>
            </div>
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import { Colors } from '@aerogel/core';
import { invert } from '@noeldemartin/utils';
import { ref } from 'vue';
import type { Color } from '@aerogel/core';

const content = ref('Click me!');
const color = ref<Color>(Colors.Primary);
const colorOptions = invert(Colors);
</script>

<style>
.story-<% component.slug %> {
    grid-template-columns: repeat(2, 300px) !important;
}

.story-<% component.slug %> .variant-playground,
.story-<% component.slug %> .variant-colors{
    grid-column: 1 / -1;
}
</style>
