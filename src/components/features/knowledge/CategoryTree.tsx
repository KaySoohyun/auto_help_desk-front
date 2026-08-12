"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useArticles } from "@/hooks/knowledge/useArticles";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpenIcon, InboxIcon, AlertTriangleIcon } from "lucide-react";

export function CategoryTree() {
  const { data, isLoading, isError } = useArticles({ status: "published", limit: 200, offset: 0 });

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const article of data?.items ?? []) {
      if (!article.category) continue;
      counts.set(article.category, (counts.get(article.category) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-2" aria-label="Cargando categorías">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="flex items-center gap-2 rounded-lg border border-destructive/60 bg-destructive/40 px-4 py-3 text-sm text-destructive-foreground"
      >
        <AlertTriangleIcon className="size-4" aria-hidden />
        No se pudieron cargar las categorías.
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
        <InboxIcon className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          No hay artículos publicados con categoría todavía.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2" role="list" aria-label="Categorías">
      {categories.map(([category, count]) => (
        <Link
          key={category}
          href={`/app/knowledge/articles?category=${encodeURIComponent(category)}`}
          role="listitem"
          className="flex items-center justify-between gap-2 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <span className="flex min-w-0 items-center gap-2 text-foreground">
            <FolderOpenIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate">{category}</span>
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {count} artículo{count === 1 ? "" : "s"}
          </span>
        </Link>
      ))}
    </div>
  );
}
