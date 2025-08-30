"use client";

import { useState, useCallback, useEffect } from 'react';
import { FormConfig, FormData, FormErrors } from '@/types/form-fields';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ShadcnDynamicFormProps {
  config: FormConfig;
  onSubmit: (data: FormData) => void;
  onChange?: (data: FormData, errors: FormErrors) => void;
  initialData?: FormData;
  disabled?: boolean;
  className?: string;
}

export default function ShadcnDynamicForm({
  config,
  onSubmit,
  onChange,
  initialData = {},
  disabled = false,
  className = ""
}: ShadcnDynamicFormProps) {
  const [formData, setFormData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Keep form data in sync when defaults/config change, without clobbering user input
  useEffect(() => {
    setFormData((prev) => {
      const next: FormData = {};
      const sections = config.sections || [];

      sections.forEach((section) => {
        section.fields.forEach((field: any) => {
          const prevVal = prev[field.id];
          const initialVal = (initialData as any)[field.id];
          const fieldDefault = (field as any).defaultValue;

          const hasPrev = prevVal !== undefined && prevVal !== null && prevVal !== '';
          if (hasPrev) {
            next[field.id] = prevVal;
          } else if (initialVal !== undefined && initialVal !== null && initialVal !== '') {
            next[field.id] = initialVal;
          } else if (fieldDefault !== undefined) {
            next[field.id] = fieldDefault;
          }
        });
      });

      return next;
    });

    // Reset validation state on config/defaults change
    setErrors({});
    setTouched({});
  }, [config, initialData]);

  const validateField = useCallback((fieldId: string, value: any, fieldConfig: any): string | null => {
    const field = config.sections
      .flatMap(section => section.fields)
      .find(f => f.id === fieldId);

    if (!field) return null;

    // Required field validation
    if (field.required && (value === null || value === undefined || value === '')) {
      return `${field.label} is required`;
    }

    // Skip further validation if field is empty and not required
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Type-specific validation
    if (field.validation) {
      const { min, max, minLength, maxLength, pattern, custom } = field.validation;

      if (typeof value === 'string') {
        if (minLength && value.length < minLength) {
          return `${field.label} must be at least ${minLength} characters`;
        }
        if (maxLength && value.length > maxLength) {
          return `${field.label} must be no more than ${maxLength} characters`;
        }
        if (pattern && !new RegExp(pattern).test(value)) {
          return `${field.label} format is invalid`;
        }
      }

      if (typeof value === 'number') {
        if (min !== undefined && value < min) {
          return `${field.label} must be at least ${min}`;
        }
        if (max !== undefined && value > max) {
          return `${field.label} must be no more than ${max}`;
        }
      }

      if (custom) {
        return custom(value);
      }
    }

    return null;
  }, [config.sections]);

  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    const newFormData = { ...formData, [fieldId]: value };
    setFormData(newFormData);

    // Validate field if it has been touched
    if (touched[fieldId]) {
      const error = validateField(fieldId, value, null);
      const newErrors = { ...errors };
      if (error) {
        newErrors[fieldId] = error;
      } else {
        delete newErrors[fieldId];
      }
      setErrors(newErrors);

      // Call onChange callback
      if (onChange) {
        onChange(newFormData, newErrors);
      }
    }
  }, [formData, errors, touched, validateField, onChange]);

  const handleFieldBlur = useCallback((fieldId: string) => {
    setTouched(prev => ({ ...prev, [fieldId]: true }));

    const error = validateField(fieldId, formData[fieldId], null);
    const newErrors = { ...errors };
    if (error) {
      newErrors[fieldId] = error;
    } else {
      delete newErrors[fieldId];
    }
    setErrors(newErrors);
  }, [formData, errors, validateField]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    config.sections.forEach(section => {
      section.fields.forEach(field => {
        allTouched[field.id] = true;
      });
    });
    setTouched(allTouched);

    // Simple validation for now - in a real implementation we'd use react-hook-form
    let isValid = true;
    const newErrors: FormErrors = {};

    config.sections.forEach(section => {
      section.fields.forEach(field => {
        const error = validateField(field.id, formData[field.id], field);
        if (error) {
          newErrors[field.id] = error;
          isValid = false;
        }
      });
    });

    setErrors(newErrors);

    if (isValid) {
      onSubmit(formData);
    }
  }, [config.sections, formData, validateField, onSubmit]);

  const renderField = (field: any) => {
    const value = formData[field.id];
    const error = errors[field.id];
    const isTouched = touched[field.id];

    switch (field.type) {
      case 'text':
        return (
          <div className="grid gap-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              onBlur={() => handleFieldBlur(field.id)}
              placeholder={field.placeholder}
              disabled={disabled || field.disabled}
            />
            {field.description && (
              <p className="text-muted-foreground text-sm">{field.description}</p>
            )}
            {isTouched && error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div className="grid gap-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              onBlur={() => handleFieldBlur(field.id)}
              placeholder={field.placeholder}
              disabled={disabled || field.disabled}
              rows={3}
            />
            {field.description && (
              <p className="text-muted-foreground text-sm">{field.description}</p>
            )}
            {isTouched && error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div className="grid gap-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value ? Number(e.target.value) : '')}
              onBlur={() => handleFieldBlur(field.id)}
              placeholder={field.placeholder}
              disabled={disabled || field.disabled}
              min={field.min}
              max={field.max}
            />
            {field.description && (
              <p className="text-muted-foreground text-sm">{field.description}</p>
            )}
            {isTouched && error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        );

      case 'slider':
        return (
          <div className="grid gap-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Slider
              id={field.id}
              value={[value || field.defaultValue || 0]}
              onValueChange={(vals) => handleFieldChange(field.id, vals[0])}
              min={field.min}
              max={field.max}
              step={field.step}
              disabled={disabled || field.disabled}
            />
            <div className="flex justify-between">
              {field.description && (
                <p className="text-muted-foreground text-sm">{field.description}</p>
              )}
              <span className="text-sm text-muted-foreground">{value || field.defaultValue || 0} {field.unit}</span>
            </div>
            {isTouched && error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div className="grid gap-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={value !== undefined && value !== null ? String(value) : ''}
              onValueChange={(val) => handleFieldChange(field.id, val)}
              disabled={disabled || field.disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option: any) => (
                  <SelectItem key={String(option.value)} value={String(option.value)} disabled={option.disabled}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && (
              <p className="text-muted-foreground text-sm">{field.description}</p>
            )}
            {isTouched && error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {field.description && (
                <p className="text-muted-foreground text-sm">{field.description}</p>
              )}
            </div>
            <Switch
              id={field.id}
              checked={!!value}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
              disabled={disabled || field.disabled}
            />
            {isTouched && error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        );

      default:
        return (
          <div className="grid gap-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              onBlur={() => handleFieldBlur(field.id)}
              placeholder={field.placeholder}
              disabled={disabled || field.disabled}
            />
            {field.description && (
              <p className="text-muted-foreground text-sm">{field.description}</p>
            )}
            {isTouched && error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        );
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
        {config.title && (
          <Card>
            <CardHeader>
              <CardTitle>{config.title}</CardTitle>
              {config.description && <p className="text-muted-foreground">{config.description}</p>}
            </CardHeader>
          </Card>
        )}

        {config.sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              {section.title && <CardTitle>{section.title}</CardTitle>}
              {section.description && <p className="text-muted-foreground">{section.description}</p>}
            </CardHeader>
            <CardContent>
              {section.collapsible ? (
                <Accordion type="single" collapsible>
                  <AccordionItem value={section.id}>
                    <AccordionTrigger>{section.title || "Settings"}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6">
                        {section.fields.map((field) => (
                          <div key={field.id}>
                            {renderField(field)}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <div className="space-y-6">
                  {section.fields.map((field) => (
                    <div key={field.id}>
                      {renderField(field)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end">
          <Button type="submit" disabled={disabled}>
            Submit
          </Button>
        </div>
      </form>
    </>
  );
}