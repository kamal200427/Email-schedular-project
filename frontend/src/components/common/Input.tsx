
import React from "react";

interface InputProps {
  label?: string;
  name?: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  fullWidth?: boolean;
  className?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  autoComplete?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  name,
  type = "text",
  placeholder,
  value,
  defaultValue,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  readOnly = false,
  fullWidth = true,
  className = "",
  min,
  max,
  step,
  autoComplete,
}) => {
  const inputId = name || React.useId();

  return (
    <div className={`${fullWidth ? "w-full" : ""}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          {label}

          {required && (
            <span className="ml-1 text-red-500">*</span>
          )}
        </label>
      )}

      <input
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        min={min}
        max={max}
        step={step}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${inputId}-error` :
          helperText ? `${inputId}-helper` : undefined
        }
        className={`
          w-full rounded-lg border px-4 py-2.5 text-sm
          text-gray-900 placeholder:text-gray-400
          outline-none transition-all duration-200
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:cursor-not-allowed disabled:bg-gray-100
          disabled:text-gray-500
          ${
            error
              ? "border-red-500 focus:ring-red-200"
              : "border-gray-300"
          }
          ${className}
        `}
      />

      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 text-xs text-red-500"
          role="alert"
        >
          {error}
        </p>
      )}

      {!error && helperText && (
        <p
          id={`${inputId}-helper`}
          className="mt-1.5 text-xs text-gray-500"
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
