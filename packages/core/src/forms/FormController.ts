import { computed, nextTick, reactive, readonly, ref } from 'vue';
import { MagicObject, arrayRemove, fail, toString } from '@noeldemartin/utils';
import type { ComputedRef, DeepReadonly, Ref, UnwrapNestedRefs } from 'vue';

import { validate, validateType } from './validation';

export const __valueType: unique symbol = Symbol();

export interface FormFieldDefinition<
    TType extends FormFieldType = FormFieldType,
    TRules extends string = string,
    TValueType = unknown,
> {
    type: TType;
    trim?: boolean;
    default?: GetFormFieldValue<TType>;
    rules?: TRules;
    values?: TValueType[];
    [__valueType]?: TValueType;
}

export type FormFieldType = 'string' | 'enum' | 'number' | 'boolean' | 'object' | 'date';
export type FormFieldValue = GetFormFieldValue<FormFieldType>;
export type FormFieldDefinitions = Record<string, FormFieldDefinition>;

export type FormData<T> = {
    -readonly [k in keyof T]: T[k] extends FormFieldDefinition<infer TType, infer TRules, infer TValueType>
        ? TRules extends 'required'
            ? GetFormFieldValue<TType, TValueType>
            : GetFormFieldValue<TType, TValueType> | null
        : never;
};

export type FormErrors<T> = {
    [k in keyof T]: string[] | null;
};

export type GetFormFieldValue<TType, TValueType = unknown> = TType extends 'string'
    ? string
    : TType extends 'number'
      ? number
      : TType extends 'boolean'
        ? boolean
        : TType extends 'enum'
          ? TValueType
          : TType extends 'object'
            ? TValueType extends object
                ? TValueType
                : object
            : TType extends 'date'
              ? Date
              : never;

const validForms: WeakMap<FormController, ComputedRef<boolean>> = new WeakMap();

export type SubmitFormListener = () => unknown;
export type FocusFormListener = (input: string) => unknown;

export default class FormController<Fields extends FormFieldDefinitions = FormFieldDefinitions> extends MagicObject {

    public errors: DeepReadonly<UnwrapNestedRefs<FormErrors<Fields>>>;

    private _fields: Fields;
    private _data: FormData<Fields>;
    private _submitted: Ref<boolean>;
    private _errors: FormErrors<Fields>;
    private _listeners: { focus?: FocusFormListener[]; submit?: SubmitFormListener[] } = {};

    constructor(fields: Fields) {
        super();

        this._fields = fields;
        this._submitted = ref(false);
        this._data = this.getInitialData(fields);
        this._errors = this.getInitialErrors(fields);

        validForms.set(
            this,
            computed(() => !Object.values(this._errors).some((error) => error !== null)),
        );

        this.errors = readonly(this._errors);
    }

    public get valid(): boolean {
        return !!validForms.get(this)?.value;
    }

    public get submitted(): boolean {
        return this._submitted.value;
    }

    public setFieldValue<T extends keyof Fields>(field: T, value: FormData<Fields>[T]): void {
        const definition =
            this._fields[field] ?? fail<FormFieldDefinition>(`Trying to set undefined '${toString(field)}' field`);

        this._data[field] =
            definition.type === 'string' && (definition.trim ?? true)
                ? (toString(value).trim() as FormData<Fields>[T])
                : value;

        if (this._submitted.value) {
            this.validate();
        }
    }

    public getFieldValue<T extends keyof Fields>(field: T): GetFormFieldValue<Fields[T]['type']> {
        return this._data[field] as unknown as GetFormFieldValue<Fields[T]['type']>;
    }

    public getFieldRules<T extends keyof Fields>(field: T): string[] {
        return this._fields[field]?.rules?.split('|') ?? [];
    }

    public getFieldType<T extends keyof Fields>(field: T): FormFieldType | null {
        return this._fields[field]?.type ?? null;
    }

    public data(): FormData<Fields> {
        return { ...this._data };
    }

    public validate(): boolean {
        const errors = Object.entries(this._fields).reduce(
            (formErrors, [name, definition]) => {
                formErrors[name] = this.getFieldErrors(name, definition);

                return formErrors;
            },
            {} as Record<string, string[] | null>,
        );

        this.resetErrors(errors);

        return this.valid;
    }

    public reset(options: { keepData?: boolean; keepErrors?: boolean } = {}): void {
        this._submitted.value = false;

        options.keepData || this.resetData();
        options.keepErrors || this.resetErrors();
    }

    public submit(): boolean {
        this._submitted.value = true;

        const valid = this.validate();

        valid && this._listeners['submit']?.forEach((listener) => listener());

        return valid;
    }

    public on(event: 'focus', listener: FocusFormListener): () => void;
    public on(event: 'submit', listener: SubmitFormListener): () => void;
    public on(event: 'focus' | 'submit', listener: FocusFormListener | SubmitFormListener): () => void {
        this._listeners[event] ??= [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._listeners[event]?.push(listener as any);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return () => this.off(event as any, listener);
    }

    public off(event: 'focus', listener: FocusFormListener): void;
    public off(event: 'submit', listener: SubmitFormListener): void;
    public off(event: 'focus' | 'submit', listener: FocusFormListener | SubmitFormListener): void {
        arrayRemove(this._listeners[event] ?? [], listener);
    }

    public async focus(input: string): Promise<void> {
        await nextTick();

        this._listeners['focus']?.forEach((listener) => listener(input));
    }

    protected override __get(property: string): unknown {
        if (!(property in this._fields)) {
            return super.__get(property);
        }

        return this.getFieldValue(property);
    }

    protected override __set(property: string, value: unknown): void {
        if (!(property in this._fields)) {
            super.__set(property, value);

            return;
        }

        this.setFieldValue(property, value as FormData<Fields>[string]);
    }

    private getFieldErrors(name: keyof Fields, definition: FormFieldDefinition): string[] | null {
        const errors = [];
        const value = this._data[name];
        const rules = definition.rules?.split('|') ?? [];

        errors.push(...validateType(value, definition));

        for (const rule of rules) {
            if (rule !== 'required' && (value === null || value === undefined)) {
                continue;
            }

            errors.push(...validate(value, rule));
        }

        return errors.length > 0 ? errors : null;
    }

    private getInitialData(fields: Fields): FormData<Fields> {
        if (this.static().isConjuring()) {
            return {} as FormData<Fields>;
        }

        const data = Object.entries(fields).reduce((initialData, [name, definition]) => {
            initialData[name as keyof Fields] = (definition.default ?? null) as FormData<Fields>[keyof Fields];

            return initialData;
        }, {} as FormData<Fields>);

        return reactive(data) as FormData<Fields>;
    }

    private getInitialErrors(fields: Fields): FormErrors<Fields> {
        if (this.static().isConjuring()) {
            return {} as FormErrors<Fields>;
        }

        const errors = Object.keys(fields).reduce((formErrors, name) => {
            formErrors[name as keyof Fields] = null;

            return formErrors;
        }, {} as FormErrors<Fields>);

        return reactive(errors) as FormErrors<Fields>;
    }

    private resetData(): void {
        for (const [name, field] of Object.entries(this._fields)) {
            this._data[name as keyof Fields] = (field.default ?? null) as FormData<Fields>[keyof Fields];
        }
    }

    private resetErrors(errors?: Record<string, string[] | null>): void {
        Object.keys(this._errors).forEach((key) => delete this._errors[key as keyof Fields]);

        errors && Object.assign(this._errors, errors);
    }

}
