import { CategoryTree } from "@/components/features/knowledge/CategoryTree";
import { CreateCategoryDialog } from "@/components/features/knowledge/CreateCategoryDialog";
import { BackLink } from "@/components/features/tickets/BackLink";

export default async function KnowledgeCategoriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="space-y-4">
      <BackLink href={`/${slug}/app/knowledge/articles`} label="Volver a artículos" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Categorías</h1>
          <p className="text-sm text-muted-foreground">
            Artículos publicados agrupados por categoría.
          </p>
        </div>
        <CreateCategoryDialog />
      </div>
      <CategoryTree />
    </div>
  );
}
