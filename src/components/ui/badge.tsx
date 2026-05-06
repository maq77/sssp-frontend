import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all " +
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm shadow-primary/20",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-sm shadow-destructive/20",
        outline:
          "text-foreground border-border hover:bg-accent hover:text-accent-foreground",
        success:
          "border-transparent bg-green-500 text-white hover:bg-green-600 shadow-sm shadow-green-500/20",
        warning:
          "border-transparent bg-yellow-500 text-white hover:bg-yellow-600 shadow-sm shadow-yellow-500/20",
        info:
          "border-transparent bg-blue-500 text-white hover:bg-blue-600 shadow-sm shadow-blue-500/20",
        ghost: "border-transparent bg-transparent hover:bg-accent hover:text-accent-foreground",
        glow:
          "border-transparent bg-primary text-primary-foreground shadow-lg shadow-primary/50 animate-pulse-glow",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  pulse?: boolean;
}

function Badge({ className, variant, pulse, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), pulse && "animate-pulse", className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
