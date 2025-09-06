"use client";

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FormConfig, FormData, FormErrors, FormSection, FormValidationResult } from '@/types/form-fields';
import { FormField } from './form-fields';

interface DynamicFormProps {
  config: FormConfig;
  onSubmit: (data: FormData) => void;
  onChange?: (data: FormData, errors: FormErrors) => void;
  initialData?: FormData;
  disabled?: boolean;
  className?: string;
}

export default function DynamicForm({
  config,
  onSubmit,
  onChange,
  initialData = {},
  disabled = false,
  className = ""
}: DynamicFormProps) {
  const [formData, setFormData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Sync form data with incoming defaults and field-level defaults on change
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

  const validateForm = useCallback((): FormValidationResult => {
    const newErrors: FormErrors = {};
    let isValid = true;

    config.sections.forEach(section => {
      section.fields.forEach(field => {
        const error = validateField(field.id, formData[field.id], field);
        if (error) {
          newErrors[field.id] = error;
          isValid = false;
        }
      });
    });

    // Form-level validation
    if (config.validation?.custom) {
      const formError = config.validation.custom(formData);
      if (formError) {
        isValid = false;
        // Add form-level error with a special key
        newErrors._form = formError;
      }
    }

    return { isValid, errors: newErrors };
  }, [config, formData, validateField]);

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

    // Validate form
    const validation = validateForm();
    setErrors(validation.errors);

    if (validation.isValid) {
      onSubmit(formData);
    }
  }, [config.sections, formData, validateForm, onSubmit]);

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {config.title && (
        <div className="border-b border pb-4">
          <h2 className="text-2xl font-bold text-foreground">{config.title}</h2>
          {config.description && (
            <p className="mt-2 text-muted-foreground">{config.description}</p>
          )}
        </div>
      )}

      {config.sections.map((section) => (
        <div key={section.id} className="space-y-4">
          {section.title && (
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
              {section.collapsible && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {collapsedSections[section.id] ? '▼' : '▲'}
                </button>
              )}
            </div>
          )}

          {section.description && (
            <p className="text-sm text-muted-foreground">{section.description}</p>
          )}

          {(!section.collapsible || !collapsedSections[section.id]) && (
            <div className="space-y-4">
              {section.fields.map((field) => (
                <FormField
                  key={field.id}
                  config={field}
                  value={formData[field.id]}
                  onChange={(value) => handleFieldChange(field.id, value)}
                  onBlur={() => handleFieldBlur(field.id)}
                  error={errors[field.id]}
                  disabled={disabled || field.disabled}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {errors._form && (
        <div className="p-4 rounded-md border border-destructive/40 bg-destructive/10">
          <p className="text-destructive">{errors._form}</p>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border">
        <Button type="submit" disabled={disabled}>
          Submit
        </Button>
      </div>
    </form>
  );
}