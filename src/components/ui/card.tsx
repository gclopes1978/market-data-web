import * as React from "react";
import { cn } from "@/lib/utils";

// shadcn-style building blocks for dashboard cards.
export const Card = ({ className, ...p }: React.ComponentProps<"section">) => (
  <section className={cn("rounded-xl border border-border bg-card p-5", className)} {...p} />
);
/** Small muted heading of a card. */
export const CardTitle = ({ className, ...p }: React.ComponentProps<"h2">) => (
  <h2 className={cn("text-sm font-medium text-muted-foreground", className)} {...p} />
);
/** Muted caption used for data source and reference date. */
export const CardFooter = ({ className, ...p }: React.ComponentProps<"p">) => (
  <p className={cn("mt-3 text-xs text-muted-foreground", className)} {...p} />
);
