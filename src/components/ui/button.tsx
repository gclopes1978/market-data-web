import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Button styles (default/outline/ghost) and sizes (default/icon), with keyboard focus ring.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-background hover:opacity-90",
        outline: "border border-border bg-card hover:bg-muted",
        ghost: "hover:bg-muted",
      },
      size: { default: "h-9 px-3.5", icon: "size-9" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

/** Accessible button; accepts all native button props. */
export interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {}
export const Button = ({ className, variant, size, ...p }: ButtonProps) => (
  <button className={cn(buttonVariants({ variant, size }), className)} {...p} />
);
