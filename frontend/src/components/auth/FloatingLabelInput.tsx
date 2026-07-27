'use client';

import { forwardRef, useId, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, error, className, id, value, defaultValue, onFocus, onBlur, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState(Boolean(value ?? defaultValue));

    const floated = focused || hasValue || Boolean(value);

    return (
      <div className="relative">
        <motion.div
          animate={focused ? { scale: 1.01 } : { scale: 1 }}
          transition={{ duration: 0.15 }}
          className="relative"
        >
          <input
            ref={ref}
            id={inputId}
            value={value}
            defaultValue={defaultValue}
            className={cn(
              'peer h-12 w-full rounded-xl border bg-card/80 px-4 pt-4 text-sm shadow-soft outline-none transition-all duration-200',
              'placeholder-transparent focus:border-primary focus:ring-2 focus:ring-primary/20',
              error ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-border',
              className,
            )}
            placeholder={label}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              setHasValue(Boolean(event.target.value));
              onBlur?.(event);
            }}
            onChange={(event) => {
              setHasValue(Boolean(event.target.value));
              props.onChange?.(event);
            }}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              'pointer-events-none absolute left-4 origin-left text-muted transition-all duration-200',
              floated ? 'top-2 text-[11px] font-medium' : 'top-1/2 -translate-y-1/2 text-sm',
              focused && !error && 'text-primary',
              error && 'text-danger',
            )}
          >
            {label}
          </label>
        </motion.div>
        {error && (
          <motion.p
            id={`${inputId}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs text-danger"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  },
);

FloatingLabelInput.displayName = 'FloatingLabelInput';
