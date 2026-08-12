"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface ArticlesPaginationProps {
  total: number;
  limit: number;
  offset: number;
}

export function ArticlesPagination({ total, limit, offset }: ArticlesPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const goTo = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    router.push(`/app/knowledge/articles?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
      <p>
        {total} artículo{total === 1 ? "" : "s"} · Página {currentPage} de {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => goTo(currentPage - 1)}
        >
          <ChevronLeftIcon aria-hidden />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => goTo(currentPage + 1)}
        >
          Siguiente
          <ChevronRightIcon aria-hidden />
        </Button>
      </div>
    </div>
  );
}
