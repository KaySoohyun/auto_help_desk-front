import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { queryKeys } from "./queryKeys";

interface Category {
  value: string;
  label: string;
}

async function fetchCategories(): Promise<Category[]> {
  return bffFetch<Category[]>("/api/bff/tickets/categories");
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 60,
  });
}
