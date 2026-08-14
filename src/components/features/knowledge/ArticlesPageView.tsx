"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useArticles } from "@/hooks/knowledge/useArticles";
import { ArticlesFilters } from "@/components/features/knowledge/ArticlesFilters";
import { CreateCategoryDialog } from "@/components/features/knowledge/CreateCategoryDialog";
import { ArticlesTable } from "@/components/features/knowledge/ArticlesTable";
import { ArticlesPagination } from "@/components/features/knowledge/ArticlesPagination";
import { useSessionStore } from "@/stores/session.store";
import { hasKbPermission } from "@/lib/permissions";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, InboxIcon, AlertTriangleIcon, PlusIcon, FolderOpenIcon } from "lucide-react";
import type { KbArticleStatus } from "@/types/knowledge.types";

const PAGE_SIZE = 50;

const VALID_STATUSES: KbArticleStatus[] = ["draft", "published", "archived"];

export function ArticlesPageView({ searchParams }: { searchParams: Record<string, string> }) {
  const user = useSessionStore((s) => s.user);
  const canEdit = hasKbPermission(user?.role ?? null, "kb:edit");

  const rawStatus = searchParams.status;
  const status = !canEdit
    ? ("published" as const)
    : VALID_STATUSES.includes(rawStatus as KbArticleStatus)
      ? (rawStatus as KbArticleStatus)
      : undefined;
  const category = searchParams.category ?? undefined;
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { data, isLoading, isError, error } = useArticles({
    status,
    category,
    limit: PAGE_SIZE,
    offset,
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const items = useMemo(() => {
    const base = data?.items ?? [];
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return base;
    return base.filter((article) => article.title.toLowerCase().includes(q));
  }, [data, debouncedSearch]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Base de conocimiento</h1>
          <p className="text-sm text-muted-foreground">Artículos de tu soporte</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/app/knowledge/categories">
            <Button variant="outline">
              <FolderOpenIcon aria-hidden />
              Categorías
            </Button>
          </Link>
          {canEdit ? (
            <>
              <CreateCategoryDialog
                trigger={
                  <Button variant="outline">
                    <PlusIcon aria-hidden />
                    Nueva categoría
                  </Button>
                }
              />
              <Link href="/app/knowledge/articles/new">
                <Button>
                  <PlusIcon aria-hidden />
                  Nuevo artículo
                </Button>
              </Link>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título"
            aria-label="Buscar por título"
            className="w-56 pl-9"
          />
        </div>
        <ArticlesFilters hideStatus={!canEdit} />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/60 bg-destructive/40 px-4 py-3 text-sm text-destructive-foreground"
        >
          <AlertTriangleIcon className="size-4" aria-hidden />
          {error?.message ?? "No se pudieron cargar los artículos."}
        </div>
      ) : null}

      {!isLoading && !isError && data ? (
        items.length > 0 ? (
          <ArticlesTable articles={items} />
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
            <InboxIcon className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">No hay artículos para mostrar.</p>
          </div>
        )
      ) : null}

      {!isLoading && !isError && data && data.total > PAGE_SIZE ? (
        <ArticlesPagination total={data.total} limit={PAGE_SIZE} offset={offset} />
      ) : null}
    </div>
  );
}
