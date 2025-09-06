"use client";

import { TextFieldConfig, FormFieldProps } from '@/types/form-fields';

interface TextFieldProps extends FormFieldProps {
  config: TextFieldConfig;
}

export default function TextField({ config, value, onChange, error, disabled }: TextFieldProps) {
  const isTextarea = config.type === 'textarea';

  const baseClasses = "w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring md:text-sm";
  const classes = error
    ? `${baseClasses} border-destructive aria-invalid:border-destructive aria-invalid:ring-destructive/20`
    : `${baseClasses} border-input`;

  return (
    <div className="space-y-2">
      <label htmlFor={config.id} className="block text-sm font-medium">
        {config.label}
        {config.required && <span className="text-destructive ml-1">*</span>}
      </label>

      {config.description && (
        <p className="text-sm text-muted-foreground">{config.description}</p>
      )}

      {isTextarea ? (
        <textarea
          id={config.id}
          className={classes}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          disabled={disabled || config.disabled}
          rows={3}
          maxLength={config.maxLength}
          minLength={config.minLength}
        />
      ) : (
        <input
          id={config.id}
          type="text"
          className={classes}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          disabled={disabled || config.disabled}
          maxLength={config.maxLength}
          minLength={config.minLength}
        />
      )}

      {config.maxLength && (
        <p className="text-xs text-muted-foreground">
          {(value || '').length}/{config.maxLength} characters
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}