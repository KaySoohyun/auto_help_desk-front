"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArticleStatusBadge } from "@/components/features/knowledge/ArticleStatusBadge";
import { timeAgo } from "@/lib/format";
import type { KbArticleSummary } from "@/types/knowledge.types";

function ArticleRow({ article }: { article: KbArticleSummary }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/50">
      <td className="px-3 py-2 align-middle">
        <Link
          href={`/app/knowledge/articles/${article.id}`}
          className="line-clamp-2 text-sm font-medium text-foreground hover:underline"
        >
          {article.title}
        </Link>
      </td>
      <td className="px-3 py-2 align-middle">
        <ArticleStatusBadge status={article.status} />
      </td>
      <td className="px-3 py-2 align-middle text-sm text-muted-foreground">
        {article.category ?? "—"}
      </td>
      <td className="px-3 py-2 align-middle">
        {article.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {article.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-3 py-2 align-middle text-sm text-muted-foreground">
        v{article.current_version}
      </td>
      <td className="px-3 py-2 align-middle text-right text-sm text-muted-foreground whitespace-nowrap">
        {timeAgo(article.updated_at)}
      </td>
    </tr>
  );
}

export function ArticlesTable({ articles }: { articles: KbArticleSummary[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="px-3 py-2 font-medium">
              Artículo
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Estado
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Categoría
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Etiquetas
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Versión
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Actualizado
            </th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <ArticleRow key={article.id} article={article} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
