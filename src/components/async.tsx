import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

/** `query` is any TanStack query result; `children` renders the loaded data. */
interface Props<T> {
  query: UseQueryResult<T>;
  skeleton?: ReactNode;
  children: (data: T) => ReactNode;
}

/**
 * Renders loading, error (with retry button) and success states of a query.
 *
 * Design note: every card needs the same three states, so they live in one component. The render-prop
 * `children(data)` only runs when data exists, which means callers never deal with `undefined`.
 */
export function Async<T>({ query, skeleton, children }: Props<T>) {
  if (query.isPending) return <>{skeleton ?? <Skeleton className="h-16 w-full" />}</>;
  if (query.isError) {
    return (
      <p role="alert" className="text-sm text-down">
        Não foi possível carregar os dados ({query.error.message}).{" "}
        <button onClick={() => query.refetch()} className="underline">
          Tentar de novo
        </button>
      </p>
    );
  }
  return <>{children(query.data)}</>;
}
