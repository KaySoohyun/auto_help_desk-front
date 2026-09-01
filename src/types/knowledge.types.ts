export type KbArticleStatus = "draft" | "published" | "archived";

export interface KbCategory {
  id: number;
  tenant_id: string;
  name: string;
  created_at: string;
}

export interface KbArticleSummary {
  id: number;
  tenant_id: string;
  title: string;
  category: string | null;
  tags: string[];
  status: KbArticleStatus;
  author_id: number;
  author_name: string | null;
  current_version: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface KbArticle extends KbArticleSummary {
  body: string;
}

export interface KbArticleList {
  items: KbArticleSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface KbArticleVersion {
  id: number;
  article_id: number;
  version: number;
  title: string;
  body: string;
  category: string | null;
  tags: string[];
  author_id: number;
  change_note: string | null;
  created_at: string;
}

export interface KbArticleListQuery {
  status?: KbArticleStatus;
  category?: string;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface KbArticleCreatePayload {
  title: string;
  body: string;
  category?: string;
  tags?: string[];
}

export interface KbArticleUpdatePayload {
  title?: string;
  body?: string;
  category?: string;
  tags?: string[];
  change_note?: string;
}
