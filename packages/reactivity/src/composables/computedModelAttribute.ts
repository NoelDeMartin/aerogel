import { fail } from '@noeldemartin/utils';
import type { Nullable } from '@noeldemartin/utils';
import type { ComputedAttribute, Model } from 'soukai-bis';
import { customRef, getCurrentScope, onScopeDispose, toRaw, toValue, watchEffect } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';

export function computedModelAttribute<TModel extends Model, TAttribute extends string & keyof TModel>(
    model: MaybeRefOrGetter<TModel | null | undefined>,
    attribute: TAttribute,
): TModel[TAttribute] extends ComputedAttribute<infer T> ? Readonly<Ref<T | undefined>> : never {
    return customRef((track, trigger) => {
        let computedAttribute: Nullable<ComputedAttribute>;
        let unsubscribe: Nullable<() => void>;

        watchEffect(() => {
            const currentModel = toValue(model);
            const currentComputedAttribute = currentModel && toRaw(currentModel).getComputedAttribute(attribute);

            if (currentComputedAttribute === computedAttribute) {
                return;
            }

            unsubscribe?.();

            computedAttribute = currentComputedAttribute;
            unsubscribe = computedAttribute?.subscribe(() => trigger());

            trigger();
        });

        getCurrentScope() && onScopeDispose(() => unsubscribe?.());

        return {
            get: () => {
                track();

                return computedAttribute?.value;
            },
            set: () => fail('Computed model attribute ref is read-only'),
        };
    }) as TModel[TAttribute] extends ComputedAttribute<infer T> ? Readonly<Ref<T | undefined>> : never;
}
