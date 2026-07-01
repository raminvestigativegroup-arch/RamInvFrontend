import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 capitalize",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "bg-success/10 text-success border-success/20 hover:bg-success/20",
        warning: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
        info: "bg-info/10 text-info border-info/20 hover:bg-info/20",
        inactive: "bg-muted text-muted-foreground border-muted-foreground/10 hover:bg-muted/80",
        danger: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  showDot?: boolean;
}

function Badge({ className, variant, showDot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {showDot && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current shrink-0" />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
