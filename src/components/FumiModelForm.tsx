"use client";

import { useState, useMemo, useEffect } from 'react';
import { ModelMetadata } from '@/types/fal-models';
import { FormData, FormErrors } from '@/types/form-fields';
import { modelToFormConfig } from '@/utils/model-to-form';
import { validateFormData, getFormDefaults, formDataToModelInput } from '@/utils/form-validation';
import DynamicForm from './DynamicForm';

interface FumiModelFormProps {
  /** The Fumi model to generate a form for */
  model: ModelMetadata;
  /** Callback when form is submitted successfully */
  onSubmit: (modelInput: any) => void;
  /** Callback when form data changes */
  onChange?: (data: FormData, errors: FormErrors) => void;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show model information */
  showModelInfo?: boolean;
}

export default function FumiModelForm({
  model,
  onSubmit,
  onChange,
  disabled = false,
  className = "",
  showModelInfo = true
}: FumiModelFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Generate form configuration from model
  const formConfig = useMemo(() => modelToFormConfig(model), [model]);

  // Load default values for the form
  const [defaultValues, setDefaultValues] = useState<FormData>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const defaults = await getFormDefaults(model);
        if (!cancelled) setDefaultValues(defaults);
      } catch (err) {
        console.error('Failed to load default form values:', err);
        if (!cancelled) setDefaultValues({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [model]);

  const handleFormSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Validate form data
      const validation = await validateFormData(formData, model);
      if (!validation.isValid) {
        console.error('Form validation failed:', validation.errors);
        return; // DynamicForm will handle showing errors
      }

      // Convert form data to model input
      const modelInput = formDataToModelInput(formData, model);

      // Call the submit callback
      await onSubmit(modelInput);
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormChange = (data: FormData, errors: FormErrors) => {
    // Clear submit error when form data changes
    if (submitError) {
      setSubmitError(null);
    }

    // Call the change callback if provided
    if (onChange) {
      onChange(data, errors);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {showModelInfo && (
        <div className="rounded-lg p-4 border bg-card text-card-foreground">
          <h3 className="text-lg font-semibold">{model.name}</h3>
          <p className="text-muted-foreground mt-1">{model.description}</p>
          <div className="flex items-center flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
            <span className="px-2 py-0.5 rounded-md border bg-secondary text-secondary-foreground text-xs">
              {model.category.replace('-', ' ').toUpperCase()}
            </span>
            <span>Provider: {model.provider}</span>
            <span>Version: {model.version}</span>
            {model.limits?.costPerRequest && (
              <span>Cost: ${model.limits.costPerRequest} per request</span>
            )}
          </div>
          {model.capabilities && model.capabilities.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-foreground mb-2">Capabilities:</p>
              <div className="flex flex-wrap gap-2">
                {model.capabilities.map((capability, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 rounded-md border bg-accent text-accent-foreground text-xs"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <DynamicForm
        config={formConfig}
        onSubmit={handleFormSubmit}
        onChange={handleFormChange}
        initialData={defaultValues}
        disabled={disabled || isSubmitting}
      />

      {submitError && (
        <div className="p-4 rounded-md border border-destructive/40 bg-destructive/10">
          <p className="text-destructive">{submitError}</p>
        </div>
      )}

      {isSubmitting && (
        <div className="flex justify-center items-center py-4 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3">Submitting...</span>
        </div>
      )}
    </div>
  );
}

// Export types and utilities for external use
export type { FormData, FormErrors } from '@/types/form-fields';
export { modelToFormConfig } from '@/utils/model-to-form';
export { validateFormData, getFormDefaults } from '@/utils/form-validation';