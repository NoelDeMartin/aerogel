import { MagicObject } from '@noeldemartin/utils';
import { reactive, readonly, ref } from 'vue';
import type { ObjectValues } from '@noeldemartin/utils';
import type { DeepReadonly, Ref, UnwrapNestedRefs } from 'vue';

export const FormFieldTypes = {
    String: 'string',
    Number: 'number',
} as const;

export interface FormFieldDefinition<TType extends FormFieldType = FormFieldType, TRules extends string = string> {
    type: TType;
    default?: GetFormFieldValue<TType>;
    rules?: TRules;
}

export type FormFieldDefinitions = Record<string, FormFieldDefinition>;
export type FormFieldType = ObjectValues<typeof FormFieldTypes>;

export type FormData<T> = {
    [k in keyof T]: T[k] extends FormFieldDefinition<infer TType, infer TRules>
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
    : never;

export default class Form<Fields extends FormFieldDefinitions = FormFieldDefinitions> extends MagicObject {

    public errors: DeepReadonly<UnwrapNestedRefs<FormErrors<Fields>>>;

    private _fields: Fields;
    private _data: FormData<Fields>;
    private _valid: Ref<boolean>;
    private _submitted: Ref<boolean>;
    private _errors: FormErrors<Fields>;

    constructor(fields: Fields) {
        super();

        this._fields = fields;
        this._submitted = ref(false);
        this._valid = ref(true);
        this._data = this.getInitialData(fields);
        this._errors = this.getInitialErrors(fields);

        this.errors = readonly(this._errors);
    }

    public get valid(): boolean {
        return this._valid.value;
    }

    public get submitted(): boolean {
        return this._submitted.value;
    }

    public setFieldValue<T extends keyof Fields>(field: T, value: FormData<Fields>[T]): void {
        this._data[field] = value;

        if (this._submitted.value) {
            this.validate();
        }
    }

    public getFieldValue<T extends keyof Fields>(field: T): GetFormFieldValue<Fields[T]['type']> {
        return this._data[field] as unknown as GetFormFieldValue<Fields[T]['type']>;
    }

    public validate(): boolean {
        const errors = Object.entries(this._fields).reduce((errors, [name, definition]) => {
            errors[name] = this.getFieldErrors(name, definition);

            return errors;
        }, {} as Record<string, string[] | null>);

        Object.assign(this._errors, errors);

        return (this._valid.value = !Object.values(errors).some((error) => error !== null));
    }

    public submit(): boolean {
        this._submitted.value = true;

        return this.validate();
    }

    protected __get(property: string): unknown {
        if (!(property in this._fields)) {
            return super.__get(property);
        }

        return this._data[property];
    }

    protected __set(property: string, value: unknown): void {
        if (!(property in this._fields)) {
            super.__set(property, value);

            return;
        }

        Object.assign(this._data, { [property]: value });
    }

    private getFieldErrors(name: keyof Fields, definition: FormFieldDefinition): string[] | null {
        const errors = [];

        if (definition.rules?.includes('required') && !this._data[name]) {
            errors.push('required');
        }

        return errors.length > 0 ? errors : null;
    }

    private getInitialData(fields: Fields): FormData<Fields> {
        if (this.static().isConjuring()) {
            return {} as FormData<Fields>;
        }

        const data = Object.entries(fields).reduce((data, [name, definition]) => {
            data[name as keyof Fields] = (definition.default ?? null) as FormData<Fields>[keyof Fields];

            return data;
        }, {} as FormData<Fields>);

        return reactive(data) as FormData<Fields>;
    }

    private getInitialErrors(fields: Fields): FormErrors<Fields> {
        if (this.static().isConjuring()) {
            return {} as FormErrors<Fields>;
        }

        const errors = Object.keys(fields).reduce((errors, name) => {
            errors[name as keyof Fields] = null;

            return errors;
        }, {} as FormErrors<Fields>);

        return reactive(errors) as FormErrors<Fields>;
    }

}
