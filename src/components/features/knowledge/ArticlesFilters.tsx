"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
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
import type { KbArticleStatus } from "@/types/knowledge.types";

const STATUSES: Array<{ value: KbArticleStatus; label: string }> = (
  Object.entries(ARTICLE_STATUS_LABELS) as Array<[KbArticleStatus, string]>
).map(([value, label]) => ({ value, label }));

export function ArticlesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const apply = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") params.delete(key);
      else params.set(key, value);
    }
    router.push(`/app/knowledge/articles?${params.toString()}`);
  };

  const hasActive = searchParams.has("status") || searchParams.has("category");

  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      apply({ category: category.trim() || undefined });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Filtros de artículos"
    >
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

      <Input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Categoría"
        aria-label="Filtrar por categoría"
        className="w-40"
      />

      {hasActive ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCategory("");
            apply({ status: undefined, category: undefined });
          }}
        >
          <RotateCcwIcon aria-hidden />
          Limpiar
        </Button>
      ) : null}
    </div>
  );
}
