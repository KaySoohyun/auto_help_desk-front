"use client";

import Link from "next/link";
import { AlertTriangleIcon, FileTextIcon, Link2Icon } from "lucide-react";
import { useArticles } from "@/hooks/knowledge/useArticles";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { KbArticleSummary } from "@/types/knowledge.types";

const MAX_RELATED = 5;

export function RelatedArticles({
  category,
  onInsertReference,
}: {
  category?: string | null;
  onInsertReference: (article: KbArticleSummary) => void;
}) {
  const { data, isLoading, isError, error } = useArticles({
    status: "published",
    category: category ?? undefined,
    limit: MAX_RELATED,
    offset: 0,
  });

  if (isLoading) {
    return (
      <div className="space-y-2" aria-label="Cargando artículos relacionados">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="flex items-start gap-1.5 text-xs text-destructive">
        <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {error?.message ?? "No se pudieron cargar los artículos relacionados."}
      </p>
    );
  }

  const articles = data?.items ?? [];

  if (articles.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No hay artículos publicados relacionados con este ticket.
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {articles.map((article) => (
        <li
          key={article.id}
          className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-2 py-1.5"
        >
          <Link
            href={`/app/knowledge/articles/${article.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate text-xs font-medium text-foreground hover:underline"
            title={article.title}
          >
            <FileTextIcon
              className="mr-1 inline size-3.5 shrink-0 align-[-2px] text-muted-foreground"
              aria-hidden
            />
            {article.title}
          </Link>
          {article.category ? (
            <span className="hidden shrink-0 text-[10px] text-muted-foreground sm:inline">
              {article.category}
            </span>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 gap-1 px-2 text-xs"
            onClick={() => onInsertReference(article)}
            title="Insertar referencia en la respuesta"
          >
            <Link2Icon className="size-3" aria-hidden />
            Insertar
          </Button>
        </li>
      ))}
    </ul>
  );
}
