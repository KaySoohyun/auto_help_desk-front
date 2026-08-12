"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangleIcon,
  ArchiveIcon,
  Loader2Icon,
  PencilIcon,
  RotateCcwIcon,
  SendIcon,
} from "lucide-react";
import { useArticle } from "@/hooks/knowledge/useArticle";
import { usePublishArticle } from "@/hooks/knowledge/usePublishArticle";
import { useArchiveArticle } from "@/hooks/knowledge/useArchiveArticle";
import { useRestoreArticle } from "@/hooks/knowledge/useRestoreArticle";
import { useSessionStore } from "@/stores/session.store";
import { hasKbPermission } from "@/lib/permissions";
import { ArticleStatusBadge } from "@/components/features/knowledge/ArticleStatusBadge";
import { ArticleEditorForm } from "@/components/features/knowledge/ArticleEditorForm";
import { VersionHistory } from "@/components/features/knowledge/VersionHistory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDateTime } from "@/lib/format";

type ConfirmKind = "publish" | "archive" | "restore";

interface ConfirmAction {
  title: string;
  description: string;
  actionLabel: string;
  run: () => Promise<unknown>;
  pending: boolean;
}

export function ArticleDetailView({ articleId }: { articleId: number }) {
  const { data: article, isLoading, isError, error } = useArticle(articleId);
  const user = useSessionStore((s) => s.user);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState<ConfirmKind | null>(null);

  const publishArticle = usePublishArticle(articleId);
  const archiveArticle = useArchiveArticle(articleId);
  const restoreArticle = useRestoreArticle(articleId);

  if (isLoading) {
    return (
      <div className="space-y-4" aria-label="Cargando artículo">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div
        role="alert"
        className="flex items-center gap-2 rounded-lg border border-destructive/60 bg-destructive/40 px-4 py-3 text-sm text-destructive-foreground"
      >
        <AlertTriangleIcon className="size-4" aria-hidden />
        {error?.message ?? "No se pudo cargar el artículo."}
      </div>
    );
  }

  const canEdit = hasKbPermission(user?.role ?? null, "kb:edit");
  const canPublish = hasKbPermission(user?.role ?? null, "kb:publish");

  const confirmation: ConfirmAction | null =
    confirming === "publish"
      ? {
          title: "¿Publicar artículo?",
          description:
            "El artículo será visible para todos los agentes del tenant. Podrás archivarlo en cualquier momento.",
          actionLabel: "Publicar",
          run: () => publishArticle.mutateAsync(),
          pending: publishArticle.isPending,
        }
      : confirming === "archive"
        ? {
            title: "¿Archivar artículo?",
            description:
              "El artículo dejará de estar visible para los agentes. Podrás restaurarlo después.",
            actionLabel: "Archivar",
            run: () => archiveArticle.mutateAsync(),
            pending: archiveArticle.isPending,
          }
        : confirming === "restore"
          ? {
              title: "¿Restaurar artículo?",
              description: "El artículo volverá al estado Borrador para poder editarlo y republicarlo.",
              actionLabel: "Restaurar",
              run: () => restoreArticle.mutateAsync(),
              pending: restoreArticle.isPending,
            }
          : null;

  const handleConfirm = async () => {
    if (!confirmation) return;
    try {
      await confirmation.run();
      setConfirming(null);
      toast.success(`${confirmation.actionLabel} artículo: ${article.title}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo completar la acción.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted-foreground">Artículo #{article.id}</p>
          <h1 className="text-xl font-semibold text-foreground">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <ArticleStatusBadge status={article.status} />
            {article.category ? <Badge variant="outline">{article.category}</Badge> : null}
            {article.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
            <span className="text-xs text-muted-foreground">v{article.current_version}</span>
          </div>
        </div>

        {!editing ? (
          <div className="flex flex-wrap items-center gap-2">
            {canEdit ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <PencilIcon aria-hidden />
                Editar
              </Button>
            ) : null}
            {canPublish && article.status === "draft" ? (
              <Button size="sm" onClick={() => setConfirming("publish")}>
                <SendIcon aria-hidden />
                Publicar
              </Button>
            ) : null}
            {canEdit && article.status === "published" ? (
              <Button variant="outline" size="sm" onClick={() => setConfirming("archive")}>
                <ArchiveIcon aria-hidden />
                Archivar
              </Button>
            ) : null}
            {canEdit && article.status === "archived" ? (
              <Button variant="outline" size="sm" onClick={() => setConfirming("restore")}>
                <RotateCcwIcon aria-hidden />
                Restaurar
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {editing ? (
        <div className="rounded-lg border border-border bg-card p-4">
          <ArticleEditorForm article={article} onSaved={() => setEditing(false)} />
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm whitespace-pre-wrap break-words text-foreground">
              {article.body}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span>Autor #{article.author_id}</span>
            <span>Creado {formatDateTime(article.created_at)}</span>
            <span>Actualizado {formatDateTime(article.updated_at)}</span>
            {article.published_at ? (
              <span>Publicado {formatDateTime(article.published_at)}</span>
            ) : null}
          </div>

          <VersionHistory articleId={article.id} />
        </>
      )}

      <AlertDialog
        open={confirming !== null}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmation?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmation?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={confirmation?.pending}>
                Cancelar
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant={confirming === "publish" ? "default" : "secondary"}
                onClick={handleConfirm}
                disabled={confirmation?.pending}
              >
                {confirmation?.pending ? (
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                ) : null}
                {confirmation?.actionLabel}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
