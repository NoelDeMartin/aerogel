import { computed } from 'vue';
import type { Ref } from 'vue';

import { booleanProp, enumProp, objectProp, stringProp } from '@/utils/vue';
import { Colors } from '@/components/constants';
import { extractComponentProps } from '@/components/utils';
import type { ComponentPropDefinitions } from '@/components/utils';
import type { ComponentProps } from '@/utils/vue';
import type { IButton, IButtonProps } from '@/components/contracts/Button';

export interface IAGHeadlessButton extends IButton {}

export function extractButtonProps<T extends IButtonProps>(props: T): ComponentProps<IButtonProps> {
    return extractComponentProps(props, buttonProps());
}

export function buttonProps(): ComponentPropDefinitions<IButtonProps> {
    return {
        as: objectProp(),
        disabled: booleanProp(),
        color: enumProp(Colors, Colors.Primary),
        href: stringProp(),
        route: stringProp(),
        routeParams: objectProp(() => ({})),
        routeQuery: objectProp(() => ({})),
        submit: booleanProp(),
        url: stringProp(),
    };
}

export function buttonExpose($button: Ref<IAGHeadlessButton | undefined>): IButton {
    return {
        $el: computed(() => $button.value?.$el.value),
    };
}
