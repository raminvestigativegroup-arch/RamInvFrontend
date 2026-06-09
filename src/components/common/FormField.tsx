import React from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  children,
  className = "",
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-destructive text-[11px] font-semibold mt-1 ml-0.5 animate-fade-in">{error}</p>
      )}
    </div>
  );
};

export default FormField;
