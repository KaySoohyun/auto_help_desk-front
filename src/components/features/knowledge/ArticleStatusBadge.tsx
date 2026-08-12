import { Badge } from "@/components/ui/badge";
import type { KbArticleStatus } from "@/types/knowledge.types";

export const ARTICLE_STATUS_LABELS: Record<KbArticleStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
};

const ARTICLE_STATUS_VARIANTS: Record<
  KbArticleStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  published: "default",
  archived: "outline",
};

export function ArticleStatusBadge({ status }: { status: KbArticleStatus }) {
  return <Badge variant={ARTICLE_STATUS_VARIANTS[status]}>{ARTICLE_STATUS_LABELS[status]}</Badge>;
}
