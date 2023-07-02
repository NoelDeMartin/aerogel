import { noop } from '@noeldemartin/utils';
import { onMounted, onUnmounted } from 'vue';

export function onCleanMounted(operation: () => Function): void {
    let cleanUp: Function = noop;

    onMounted(() => (cleanUp = operation()));
    onUnmounted(() => cleanUp());
}
