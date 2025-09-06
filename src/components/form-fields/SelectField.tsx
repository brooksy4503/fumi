"use client";

import { SelectFieldConfig, FormFieldProps } from '@/types/form-fields';
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface SelectFieldProps extends FormFieldProps {
  config: SelectFieldConfig;
}

export default function SelectField({ config, value, onChange, error, disabled }: SelectFieldProps) {
  const isMultiselect = config.type === 'multiselect';

  const baseClasses = "w-full";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isMultiselect) {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      onChange(selectedOptions);
    } else {
      onChange(e.target.value);
    }
  };

  const selectedValues = Array.isArray(value) ? value : [value].filter(Boolean);

  return (
    <div className="space-y-2">
      <Label htmlFor={config.id} className="block text-sm font-medium">
        {config.label}
        {config.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {config.description && (
        <p className="text-sm text-muted-foreground">{config.description}</p>
      )}

      {isMultiselect ? (
        <div className="space-y-2">
          <div className="grid gap-2">
            <Label className="text-sm text-muted-foreground">Select one or more</Label>
            <select
              id={config.id}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring md:text-sm border-input"
              value={undefined}
              onChange={handleChange}
              disabled={disabled || config.disabled}
              multiple
              size={Math.min(4, config.options.length)}
            >
              {config.options.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {selectedValues.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedValues.map((selectedValue) => {
                const option = config.options.find(opt => opt.value === selectedValue);
                return option ? (
                  <span
                    key={selectedValue}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground border"
                  >
                    {option.label}
                    <button
                      type="button"
                      onClick={() => {
                        const newValues = selectedValues.filter(v => v !== selectedValue);
                        onChange(newValues);
                      }}
                      className="ml-1 text-primary hover:underline"
                    >
                      ×
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      ) : (
        <ShadcnSelect
          value={value !== undefined && value !== null ? String(value) : ''}
          onValueChange={(val) => {
            const matched = config.options.find(opt => String(opt.value) === val)
            onChange(matched ? matched.value : val)
          }}
          disabled={disabled || config.disabled}
        >
          <SelectTrigger className={baseClasses} id={config.id}>
            <SelectValue placeholder="Select an option..." />
          </SelectTrigger>
          <SelectContent>
            {config.options.map((option) => (
              <SelectItem key={String(option.value)} value={String(option.value)} disabled={option.disabled}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </ShadcnSelect>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}