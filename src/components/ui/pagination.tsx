"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface PaginationControlsProps {
  total: number;
  limit: number;
  offset: number;
  /** Etiqueta en singular para el contador (p. ej. "ticket", "usuario", "cliente"). */
  itemLabel: string;
  onPageChange: (page: number) => void;
}

/**
 * Paginador controlled compartido (misma UI que el de tickets).
 * `offset` = (page - 1) * limit; el padre decide dónde persistir la página.
 */
export function PaginationControls({
  total,
  limit,
  offset,
  itemLabel,
  onPageChange,
}: PaginationControlsProps) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
      <p>
        {total} {itemLabel}
        {total === 1 ? "" : "s"} · Página {currentPage} de {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeftIcon aria-hidden />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Siguiente
          <ChevronRightIcon aria-hidden />
        </Button>
      </div>
    </div>
  );
}