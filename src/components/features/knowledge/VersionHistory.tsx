"use client";

import { useArticleVersions } from "@/hooks/knowledge/useArticleVersions";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { HistoryIcon } from "lucide-react";

export function VersionHistory({ articleId }: { articleId: number }) {
  const { data: versions, isLoading, isError } = useArticleVersions(articleId);

  return (
    <section className="space-y-3" aria-label="Historial de versiones">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <HistoryIcon className="size-4" aria-hidden />
        Historial de versiones
      </h2>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <p className="text-sm text-muted-foreground">No se pudieron cargar las versiones.</p>
      ) : null}

      {!isLoading && !isError && versions ? (
        versions.length > 0 ? (
          <ol className="divide-y divide-border rounded-lg border border-border">
            {versions.map((version) => (
              <li
                key={version.id}
                className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium text-foreground">Versión {version.version}</p>
                  {version.change_note ? (
                    <p className="truncate text-sm text-muted-foreground">{version.change_note}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground/70">Autor #{version.author_id}</p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateTime(version.created_at)}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">Sin versiones registradas.</p>
        )
      ) : null}
    </section>
  );
}
