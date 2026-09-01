"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PaginationControls } from "@/components/ui/pagination";
import { useTenantSlug } from "@/hooks/useTenantSlug";

interface TicketsPaginationProps {
  total: number;
  limit: number;
  offset: number;
}

export function TicketsPagination({ total, limit, offset }: TicketsPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = useTenantSlug();

  const goTo = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    router.push(`/${slug}/app/tickets?${params.toString()}`);
  };

  return <PaginationControls total={total} limit={limit} offset={offset} itemLabel="ticket" onPageChange={goTo} />;
}