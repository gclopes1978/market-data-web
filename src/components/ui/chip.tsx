import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Small pill-shaped toggle button. `active` marks the selected option and is exposed to
 * assistive technology through aria-pressed (so screen readers announce "pressed").
 */
export const Chip = ({ active, className, ...p }: React.ComponentProps<"button"> & { active?: boolean }) => (
  <button
    type="button"
    aria-pressed={active}
    className={cn(
      "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
      active ? "border-primary bg-primary text-background" : "border-border bg-card hover:bg-muted",
      className,
    )}
    {...p}
  />
);
