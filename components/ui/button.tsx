"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-black hover:brightness-110 shadow-[0_0_0_1px_rgba(212,255,63,0.3),0_8px_30px_-12px_rgba(212,255,63,0.5)]",
        secondary:
          "bg-surface-2 text-foreground hover:bg-surface-3 border border-border-subtle",
        ghost: "text-foreground-muted hover:text-foreground hover:bg-surface-2",
        danger: "bg-danger/15 text-danger hover:bg-danger/25",
        outline:
          "border border-border-strong text-foreground hover:bg-surface-2",
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-full",
        md: "h-11 px-5 text-sm rounded-full",
        lg: "h-14 px-7 text-base rounded-full",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
