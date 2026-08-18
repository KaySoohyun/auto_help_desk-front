import { ArticleDetailView } from "@/components/features/knowledge/ArticleDetailView";
import { BackLink } from "@/components/features/tickets/BackLink";

export default async function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  const numericId = Number.parseInt(articleId, 10);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Artículo inválido.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <BackLink href="/app/knowledge/articles" label="Volver a artículos" />
      <ArticleDetailView articleId={numericId} />
    </div>
  );
}
