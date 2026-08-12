import type { KbArticleListQuery } from "@/types/knowledge.types";

export function articleListKey(tenantId: string | null, query: KbArticleListQuery) {
  return ["tenant", tenantId ?? "global", "knowledge", query] as const;
}

export function articleDetailKey(tenantId: string | null, articleId: number) {
  return ["tenant", tenantId ?? "global", "knowledge", articleId] as const;
}

export function articleVersionsKey(tenantId: string | null, articleId: number) {
  return ["tenant", tenantId ?? "global", "knowledge", articleId, "versions"] as const;
}
