import { ArticlesPageView } from "@/components/features/knowledge/ArticlesPageView";

export default async function KnowledgeArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const plain: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") plain[key] = value;
  }

  return <ArticlesPageView searchParams={plain} />;
}
