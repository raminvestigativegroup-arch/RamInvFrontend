import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectDropdownOption {
  value: string;
  label: string;
}

interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectDropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  variant?: "success" | "warning" | "info" | "destructive" | "inactive" | "default";
}

const dropdownVariants = {
  default: "bg-secondary border-border text-foreground",
  success: "bg-success/10 text-success border-success/20 hover:bg-success/20",
  warning: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
  info: "bg-info/10 text-info border-info/20 hover:bg-info/20",
  inactive: "bg-muted text-muted-foreground border-muted-foreground/10 hover:bg-muted/80",
};

const SelectDropdown: React.FC<SelectDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  variant = "default",
}) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={`w-full h-[38px] border mb-1 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed ${dropdownVariants[variant]} ${className}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          {variant !== "default" && (
            <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />
          )}
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SelectDropdown;
