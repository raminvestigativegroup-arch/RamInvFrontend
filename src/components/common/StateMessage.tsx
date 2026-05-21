import React from "react";
import { Loader2, AlertCircle, Inbox, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StateMessageProps {
  type: "loading" | "error" | "empty";
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: LucideIcon;
  className?: string;
  inline?: boolean;
}

const StateMessage: React.FC<StateMessageProps> = ({
  type,
  title,
  message,
  onRetry,
  retryLabel = "Try Again",
  icon: CustomIcon,
  className = "",
  inline = false,
}) => {
  // Select icon based on state type
  const getIcon = () => {
    if (CustomIcon) return <CustomIcon className="w-5 h-5" />;
    
    switch (type) {
      case "loading":
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case "error":
        return <AlertCircle className="w-5 h-5" />;
      case "empty":
        return <Inbox className="w-5 h-5 text-muted-foreground" />;
    }
  };

  // Select base styling based on state type
  const getStyles = () => {
    switch (type) {
      case "loading":
        return "bg-card border border-border text-muted-foreground";
      case "error":
        return "bg-card border border-destructive/40 text-destructive shadow-sm shadow-destructive/5";
      case "empty":
        return "bg-card border border-border text-muted-foreground";
    }
  };

  const containerPadding = inline ? "p-4" : "p-8 text-center";
  const iconSpacing = inline ? "mr-3" : "mx-auto mb-3";
  const layoutClasses = inline 
    ? "flex items-center" 
    : "flex flex-col items-center justify-center";

  return (
    <div
      className={`rounded-xl text-sm ${getStyles()} ${containerPadding} ${layoutClasses} ${className}`}
    >
      <div className={`flex items-center justify-center shrink-0 ${iconSpacing}`}>
        {getIcon()}
      </div>
      <div className={inline ? "flex-1 min-w-0" : ""}>
        {title && (
          <h4 className={`font-semibold ${inline ? "text-sm" : "text-base mb-1"} text-foreground`}>
            {title}
          </h4>
        )}
        {message && (
          <p className={inline ? "text-xs opacity-90 line-clamp-2" : "text-sm max-w-md mx-auto"}>
            {message}
          </p>
        )}
      </div>
      {onRetry && (
        <div className={inline ? "ml-4" : "mt-4"}>
          <Button
            variant={type === "error" ? "destructive" : "outline"}
            size="sm"
            onClick={onRetry}
            className="h-8"
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default StateMessage;
