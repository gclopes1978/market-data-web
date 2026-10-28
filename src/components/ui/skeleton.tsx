import * as React from "react";
import { cn } from "@/lib/utils";

/** Pulsing placeholder shown while data loads. */
export const Skeleton = ({ className, ...p }: React.ComponentProps<"div">) => (
  <div aria-hidden className={cn("animate-pulse rounded-md bg-muted", className)} {...p} />
);
