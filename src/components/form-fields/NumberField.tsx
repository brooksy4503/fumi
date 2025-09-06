"use client";

import { NumberFieldConfig, FormFieldProps } from '@/types/form-fields';

interface NumberFieldProps extends FormFieldProps {
  config: NumberFieldConfig;
}

export default function NumberField({ config, value, onChange, error, disabled }: NumberFieldProps) {
  const isSlider = config.type === 'slider';

  const baseClasses = "w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring md:text-sm";
  const classes = error
    ? `${baseClasses} border-destructive aria-invalid:border-destructive aria-invalid:ring-destructive/20`
    : `${baseClasses} border-input`;

  const handleChange = (newValue: number | undefined) => {
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <label htmlFor={config.id} className="block text-sm font-medium">
        {config.label}
        {config.required && <span className="text-destructive ml-1">*</span>}
        {config.unit && <span className="text-muted-foreground ml-2">({config.unit})</span>}
      </label>

      {config.description && (
        <p className="text-sm text-muted-foreground">{config.description}</p>
      )}

      <div className="space-y-3">
        {isSlider ? (
          <>
            <input
              id={config.id}
              type="range"
              className="w-full h-2 bg-input rounded-lg appearance-none cursor-pointer slider"
              value={value || config.min || 0}
              onChange={(e) => handleChange(Number(e.target.value))}
              min={config.min}
              max={config.max}
              step={config.step || 1}
              disabled={disabled || config.disabled}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{config.min || 0}</span>
              <span className="font-medium">{value || config.defaultValue || config.min || 0}</span>
              <span>{config.max || 100}</span>
            </div>
          </>
        ) : (
          <input
            id={config.id}
            type="number"
            className={classes}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : undefined)}
            placeholder={config.placeholder}
            disabled={disabled || config.disabled}
            min={config.min}
            max={config.max}
            step={config.step || 1}
          />
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}