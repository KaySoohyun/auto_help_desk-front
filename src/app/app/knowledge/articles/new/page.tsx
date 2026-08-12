import { ArticleEditorForm } from "@/components/features/knowledge/ArticleEditorForm";
import { BackLink } from "@/components/features/tickets/BackLink";

export default function NewArticlePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <BackLink href="/app/knowledge/articles" label="Volver a artículos" />
      <div>
        <h1 className="text-xl font-semibold text-foreground">Nuevo artículo</h1>
        <p className="text-sm text-muted-foreground">Se guardará como borrador.</p>
      </div>
      <ArticleEditorForm />
    </div>
  );
}
