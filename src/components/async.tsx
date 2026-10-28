import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

/** `query` is any TanStack query result; `children` renders the loaded data. */
interface Props<T> {
  query: UseQueryResult<T>;
  skeleton?: ReactNode;
  /** Optional custom error sentence (e.g. a friendlier message for a known failure). */
  describeError?: (error: Error) => string;
  children: (data: T) => ReactNode;
}

/**
 * Renders loading, error (with retry button) and success states of a query.
 *
 * Design note: every card needs the same three states, so they live in one component. The render-prop
 * `children(data)` only runs when data exists, which means callers never deal with `undefined`.
 */
export function Async<T>({ query, skeleton, describeError, children }: Props<T>) {
  if (query.isPending) return <>{skeleton ?? <Skeleton className="h-16 w-full" />}</>;
  if (query.isError) {
    return (
      <p role="alert" className="text-sm text-down">
        {describeError ? describeError(query.error) : `Could not load data (${query.error.message}).`}{" "}
        <button onClick={() => query.refetch()} className="underline">
          Try again
        </button>
      </p>
    );
  }
  return <>{children(query.data)}</>;
}
