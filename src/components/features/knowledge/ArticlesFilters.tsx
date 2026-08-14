"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcwIcon } from "lucide-react";
import { ARTICLE_STATUS_LABELS } from "@/components/features/knowledge/ArticleStatusBadge";
import { useKbCategories } from "@/hooks/knowledge/useKbCategories";
import type { KbArticleStatus } from "@/types/knowledge.types";

const STATUSES: Array<{ value: KbArticleStatus; label: string }> = (
  Object.entries(ARTICLE_STATUS_LABELS) as Array<[KbArticleStatus, string]>
).map(([value, label]) => ({ value, label }));

export function ArticlesFilters({ hideStatus = false }: { hideStatus?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories = [] } = useKbCategories();

  const apply = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") params.delete(key);
      else params.set(key, value);
    }
    router.push(`/app/knowledge/articles?${params.toString()}`);
  };

  const hasActive =
    (!hideStatus && searchParams.has("status")) || searchParams.has("category");

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Filtros de artículos"
    >
      {!hideStatus ? (
        <Select
          value={searchParams.get("status") ?? ""}
          onValueChange={(value) => apply({ status: value })}
        >
          <SelectTrigger aria-label="Filtrar por estado" className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            {STATUSES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <Select
        value={searchParams.get("category") ?? ""}
        onValueChange={(value) => apply({ category: value || undefined })}
      >
        <SelectTrigger aria-label="Filtrar por categoría" className="w-44">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todas las categorías</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.name}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActive ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => apply({ status: undefined, category: undefined })}
        >
          <RotateCcwIcon aria-hidden />
          Limpiar
        </Button>
      ) : null}
    </div>
  );
}
