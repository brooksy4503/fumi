/**
 * Types for dynamic form field system
 */

export type FieldType =
    | 'text'
    | 'textarea'
    | 'number'
    | 'slider'
    | 'select'
    | 'multiselect'
    | 'file'
    | 'image'
    | 'audio'
    | 'video'
    | 'boolean'
    | 'range'
    | 'color'
    | 'date'
    | 'time'
    | 'datetime';

export interface BaseFieldConfig {
    /** Unique identifier for the field */
    id: string;
    /** Human-readable label */
    label: string;
    /** Field type */
    type: FieldType;
    /** Field description or help text */
    description?: string;
    /** Whether the field is required */
    required?: boolean;
    /** Whether the field is disabled */
    disabled?: boolean;
    /** Placeholder text */
    placeholder?: string;
    /** Default value */
    defaultValue?: any;
    /** Validation rules */
    validation?: {
        min?: number;
        max?: number;
        minLength?: number;
        maxLength?: number;
        pattern?: string;
        custom?: (value: any) => string | null;
    };
}

export interface TextFieldConfig extends BaseFieldConfig {
    type: 'text' | 'textarea';
    /** Maximum length for text inputs */
    maxLength?: number;
    /** Minimum length for text inputs */
    minLength?: number;
}

export interface NumberFieldConfig extends BaseFieldConfig {
    type: 'number' | 'slider';
    /** Minimum value */
    min?: number;
    /** Maximum value */
    max?: number;
    /** Step size */
    step?: number;
    /** Unit label (e.g., "px", "seconds", "%") */
    unit?: string;
}

export interface SelectFieldConfig extends BaseFieldConfig {
    type: 'select' | 'multiselect';
    /** Available options */
    options: Array<{
        value: string | number;
        label: string;
        disabled?: boolean;
    }>;
    /** Allow multiple selections (for multiselect) */
    multiple?: boolean;
}

export interface FileFieldConfig extends BaseFieldConfig {
    type: 'file' | 'image' | 'audio' | 'video';
    /** Accepted file types */
    accept?: string;
    /** Maximum file size in bytes */
    maxSize?: number;
    /** Allow multiple files */
    multiple?: boolean;
}

export interface BooleanFieldConfig extends BaseFieldConfig {
    type: 'boolean';
    /** Label for the true state */
    trueLabel?: string;
    /** Label for the false state */
    falseLabel?: string;
}

export interface RangeFieldConfig extends BaseFieldConfig {
    type: 'range';
    /** Minimum value */
    min: number;
    /** Maximum value */
    max: number;
    /** Step size */
    step?: number;
    /** Unit label */
    unit?: string;
}

export type FieldConfig =
    | TextFieldConfig
    | NumberFieldConfig
    | SelectFieldConfig
    | FileFieldConfig
    | BooleanFieldConfig
    | RangeFieldConfig
    | BaseFieldConfig; // For other field types

export interface FormSection {
    /** Section identifier */
    id: string;
    /** Section title */
    title?: string;
    /** Section description */
    description?: string;
    /** Fields in this section */
    fields: FieldConfig[];
    /** Whether this section is collapsible */
    collapsible?: boolean;
    /** Whether this section is collapsed by default */
    collapsed?: boolean;
}

export interface FormConfig {
    /** Form identifier */
    id: string;
    /** Form title */
    title?: string;
    /** Form description */
    description?: string;
    /** Form sections */
    sections: FormSection[];
    /** Form-level validation */
    validation?: {
        custom?: (values: Record<string, any>) => string | null;
    };
}

export interface FormFieldProps {
    config: FieldConfig;
    value: any;
    onChange: (value: any) => void;
    onBlur?: () => void;
    error?: string;
    disabled?: boolean;
}

export interface FormData {
    [fieldId: string]: any;
}

export interface FormErrors {
    [fieldId: string]: string;
}

export interface FormValidationResult {
    isValid: boolean;
    errors: FormErrors;
}
