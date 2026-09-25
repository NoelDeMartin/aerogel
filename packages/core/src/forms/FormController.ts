import { computed, nextTick, reactive, readonly, ref } from 'vue';
import { MagicObject, arrayRemove } from '@noeldemartin/utils';
import type { ComputedRef, DeepReadonly, Ref, UnwrapNestedRefs } from 'vue';
import type { z } from 'zod';

import { getDefaultValue, getFinalSchema, isBooleanSchema, isSchemaRequired, validateSchema } from './internals/zod';

const validForms: WeakMap<FormController, ComputedRef<boolean>> = new WeakMap();

type WidenBooleanLiterals<T> = T extends boolean ? boolean : T;

export type FormFieldDefinition<T = unknown> = z.ZodType<T>;
export type FormFieldDefinitions = Record<string, FormFieldDefinition>;

export type GetFormFieldValue<T extends FormFieldDefinition> = [Extract<z.output<T>, null | undefined>] extends [never]
    ? WidenBooleanLiterals<z.output<T>>
    : WidenBooleanLiterals<NonNullable<z.output<T>>> | null;

export type FormData<T> = {
    -readonly [k in keyof T]: T[k] extends FormFieldDefinition ? GetFormFieldValue<T[k]> : never;
};

export type FormErrors<T> = {
    [k in keyof T]: string[] | null;
};

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

    public getFieldValue<T extends keyof Fields>(field: T): FormData<Fields>[T] {
        return this._data[field];
    }

    public setFieldValue<T extends keyof Fields>(field: T, value: FormData<Fields>[T]): void {
        this._data[field] = value;

        if (!this._submitted.value) {
            return;
        }

        this.validate();
    }

    public getFieldSchema<T extends keyof Fields>(field: T): Fields[T] | null {
        return this._fields[field] ?? null;
    }

    public setFieldSchema<T extends keyof Fields>(field: T, schema: Fields[T]): void {
        if (!this._fields[field]) {
            return;
        }

        this._fields[field] = schema;
    }

    public isFieldRequired<T extends keyof Fields>(field: T): boolean {
        const schema = this._fields[field];

        return schema ? isSchemaRequired(schema) : false;
    }

    public getFieldErrors<T extends keyof Fields>(field: T): string[] | null {
        return this._errors[field] ?? null;
    }

    public setFieldErrors<T extends keyof Fields>(field: T, errors: string[] | null): void {
        this._errors[field] = errors;
    }

    public getFieldNativeInputType<T extends keyof Fields>(field: T): string | null {
        const schema = this.getFieldSchema(field);

        if (!schema) {
            return null;
        }

        const finalSchema = getFinalSchema(schema);

        if (isBooleanSchema(finalSchema)) {
            return 'checkbox';
        }

        switch (finalSchema.def.type) {
            case 'string': {
                const stringSchema = finalSchema as z.ZodString;
                const format = stringSchema.format;

                return format === 'email' || format === 'url' ? format : 'text';
            }
            case 'number':
            case 'date':
                return finalSchema.def.type;
            case 'literal':
                return 'text';
            default:
                return null;
        }
    }

    public data(): FormData<Fields> {
        return { ...this._data };
    }

    public validate(): boolean {
        const errors = Object.entries(this._fields).reduce(
            (formErrors, [name, definition]) => {
                formErrors[name] = this.computeFieldErrors(name, definition);

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

        for (const [field, value] of Object.entries(this._data)) {
            if (typeof value !== 'string') {
                continue;
            }

            this._data[field as keyof Fields] = (value.trim() || null) as FormData<Fields>[string];
        }

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

    private computeFieldErrors(name: keyof Fields, definition: FormFieldDefinition): string[] | null {
        const errors = validateSchema(definition, this._data[name]);

        return errors.length > 0 ? errors : null;
    }

    private getInitialData(fields: Fields): FormData<Fields> {
        if (this.static().isConjuring()) {
            return {} as FormData<Fields>;
        }

        const data = Object.entries(fields).reduce((initialData, [name, definition]) => {
            initialData[name as keyof Fields] = getDefaultValue(definition) as FormData<Fields>[keyof Fields];

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
            this._data[name as keyof Fields] = getDefaultValue(field) as FormData<Fields>[keyof Fields];
        }
    }

    private resetErrors(errors?: Record<string, string[] | null>): void {
        Object.keys(this._errors).forEach((key) => delete this._errors[key as keyof Fields]);

        errors && Object.assign(this._errors, errors);
    }

}
