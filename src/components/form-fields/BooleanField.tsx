"use client";

import { BooleanFieldConfig, FormFieldProps } from '@/types/form-fields';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface BooleanFieldProps extends FormFieldProps {
  config: BooleanFieldConfig;
}

export default function BooleanField({ config, value, onChange, error, disabled }: BooleanFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label className="text-base" htmlFor={config.id}>
            {config.label}
            {config.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {config.description && (
            <p className="text-sm text-muted-foreground">{config.description}</p>
          )}
        </div>
        <Switch
          id={config.id}
          checked={!!value}
          onCheckedChange={(checked) => onChange(checked)}
          disabled={disabled || config.disabled}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}