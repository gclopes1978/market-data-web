import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = ({ className, ...p }: React.ComponentProps<"section">) => (
  <section className={cn("rounded-xl border border-border bg-card p-5", className)} {...p} />
);
export const CardTitle = ({ className, ...p }: React.ComponentProps<"h2">) => (
  <h2 className={cn("text-sm font-medium text-muted-foreground", className)} {...p} />
);
export const CardFooter = ({ className, ...p }: React.ComponentProps<"p">) => (
  <p className={cn("mt-3 text-xs text-muted-foreground", className)} {...p} />
);
