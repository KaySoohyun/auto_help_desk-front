import { ArticleEditorForm } from "@/components/features/knowledge/ArticleEditorForm";
import { BackLink } from "@/components/features/tickets/BackLink";

export default async function NewArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <BackLink href={`/${slug}/app/knowledge/articles`} label="Volver a artículos" />
      <div>
        <h1 className="text-xl font-semibold text-foreground">Nuevo artículo</h1>
        <p className="text-sm text-muted-foreground">Se guardará como borrador.</p>
      </div>
      <ArticleEditorForm />
    </div>
  );
}
