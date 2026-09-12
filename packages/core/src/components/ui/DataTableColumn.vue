<script setup lang="ts" generic="T extends object">
import type { DeepKeyOf } from '@noeldemartin/utils';

defineProps<{
    header?: string;
    field?: DeepKeyOf<T>;
    sortable?: boolean;
}>();

defineSlots<{ default?(props: { item: T }): unknown }>();
</script>
