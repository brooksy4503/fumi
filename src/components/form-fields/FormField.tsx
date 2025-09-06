"use client";

import { FormFieldProps, FieldConfig } from '@/types/form-fields';
import TextField from './TextField';
import NumberField from './NumberField';
import SelectField from './SelectField';
import FileField from './FileField';
import BooleanField from './BooleanField';

interface FormFieldComponentProps extends FormFieldProps {
  config: FieldConfig;
}

export default function FormField(props: FormFieldComponentProps) {
  const { config, onBlur } = props;

  const fieldProps = { ...props, onBlur };

  switch (config.type) {
    case 'text':
    case 'textarea':
      return <TextField {...fieldProps} config={config as any} />;

    case 'number':
    case 'slider':
      return <NumberField {...fieldProps} config={config as any} />;

    case 'select':
    case 'multiselect':
      return <SelectField {...fieldProps} config={config as any} />;

    case 'file':
    case 'image':
    case 'audio':
    case 'video':
      return <FileField {...fieldProps} config={config as any} />;

    case 'boolean':
      return <BooleanField {...fieldProps} config={config as any} />;

    default:
      // Fallback to text field for unknown types
      return <TextField {...fieldProps} config={{ ...config, type: 'text' } as any} />;
  }
}