import { computed, nextTick, reactive, readonly, ref } from 'vue';
import { MagicObject, arrayRemove, fail, toString } from '@noeldemartin/utils';
import { validate } from './validation';
import type { ObjectValues } from '@noeldemartin/utils';
import type { ComputedRef, DeepReadonly, Ref, UnwrapNestedRefs } from 'vue';

export const FormFieldTypes = {
    String: 'string',
    Number: 'number',
    Boolean: 'boolean',
    Object: 'object',
    Date: 'date',
} as const;

export interface FormFieldDefinition<TType extends FormFieldType = FormFieldType, TRules extends string = string> {
    type: TType;
    trim?: boolean;
    default?: GetFormFieldValue<TType>;
    rules?: TRules;
}

export type FormFieldDefinitions = Record<string, FormFieldDefinition>;
export type FormFieldType = ObjectValues<typeof FormFieldTypes>;
export type FormFieldValue = GetFormFieldValue<FormFieldType>;

export type FormValues<T> = {
    -readonly [k in keyof T]: T[k] extends FormFieldDefinition<infer TType, infer TRules>
        ? TRules extends 'required'
            ? GetFormFieldValue<TType>
            : GetFormFieldValue<TType> | null
        : never;
};

export type FormErrors<T> = {
    [k in keyof T]: string[] | null;
};

export type GetFormFieldValue<TType> = TType extends typeof FormFieldTypes.String
    ? string
    : TType extends typeof FormFieldTypes.Number
      ? number
      : TType extends typeof FormFieldTypes.Boolean
        ? boolean
        : TType extends typeof FormFieldTypes.Object
          ? object
          : TType extends typeof FormFieldTypes.Date
            ? Date
            : never;

const validForms: WeakMap<FormController, ComputedRef<boolean>> = new WeakMap();

export type SubmitFormListener = () => unknown;
export type FocusFormListener = (input: string) => unknown;

export default class FormController<Fields extends FormFieldDefinitions = FormFieldDefinitions> extends MagicObject {

    public errors: DeepReadonly<UnwrapNestedRefs<FormErrors<Fields>>>;

    private _fields: Fields;
    private _values: FormValues<Fields>;
    private _submitted: Ref<boolean>;
    private _errors: FormErrors<Fields>;
    private _listeners: { focus?: FocusFormListener[]; submit?: SubmitFormListener[] } = {};

    constructor(fields: Fields) {
        super();

        this._fields = fields;
        this._submitted = ref(false);
        this._values = this.getInitialValues(fields);
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

    public setFieldValue<T extends keyof Fields>(field: T, value: FormValues<Fields>[T]): void {
        const definition =
            this._fields[field] ?? fail<FormFieldDefinition>(`Trying to set undefined '${toString(field)}' field`);

        this._values[field] =
            definition.type === FormFieldTypes.String && (definition.trim ?? true)
                ? (toString(value).trim() as FormValues<Fields>[T])
                : value;

        if (this._submitted.value) {
            this.validate();
        }
    }

    public getFieldValue<T extends keyof Fields>(field: T): GetFormFieldValue<Fields[T]['type']> {
        return this._values[field] as unknown as GetFormFieldValue<Fields[T]['type']>;
    }

    public getFieldRules<T extends keyof Fields>(field: T): string[] {
        return this._fields[field]?.rules?.split('|') ?? [];
    }

    public values(): FormValues<Fields> {
        return { ...this._values };
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

    public reset(options: { keepValues?: boolean; keepErrors?: boolean } = {}): void {
        this._submitted.value = false;

        options.keepValues || this.resetValues();
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

        this.setFieldValue(property, value as FormValues<Fields>[string]);
    }

    private getFieldErrors(name: keyof Fields, definition: FormFieldDefinition): string[] | null {
        const errors = [];
        const value = this._values[name];
        const rules = definition.rules?.split('|') ?? [];

        for (const rule of rules) {
            if (rule !== 'required' && (value === null || value === undefined)) {
                continue;
            }

            errors.push(...validate(value, rule));
        }

        return errors.length > 0 ? errors : null;
    }

    private getInitialValues(fields: Fields): FormValues<Fields> {
        if (this.static().isConjuring()) {
            return {} as FormValues<Fields>;
        }

        const values = Object.entries(fields).reduce((initialValues, [name, definition]) => {
            initialValues[name as keyof Fields] = (definition.default ?? null) as FormValues<Fields>[keyof Fields];

            return initialValues;
        }, {} as FormValues<Fields>);

        return reactive(values) as FormValues<Fields>;
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

    private resetValues(): void {
        for (const [name, field] of Object.entries(this._fields)) {
            this._values[name as keyof Fields] = (field.default ?? null) as FormValues<Fields>[keyof Fields];
        }
    }

    private resetErrors(errors?: Record<string, string[] | null>): void {
        Object.keys(this._errors).forEach((key) => delete this._errors[key as keyof Fields]);

        errors && Object.assign(this._errors, errors);
    }

}
