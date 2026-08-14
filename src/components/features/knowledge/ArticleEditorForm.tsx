"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateArticle } from "@/hooks/knowledge/useCreateArticle";
import { useUpdateArticle } from "@/hooks/knowledge/useUpdateArticle";
import { useCategories } from "@/hooks/tickets/useCategories";
import type { KbArticle } from "@/types/knowledge.types";

const articleSchema = z.object({
  title: z.string().trim().min(1, "Ingresá un título.").max(200, "Máximo 200 caracteres."),
  body: z.string().trim().min(1, "Ingresá el contenido.").max(10000, "Máximo 10000 caracteres."),
  category: z.string().trim().max(100, "Máximo 100 caracteres."),
  tags: z.string().trim().max(500, "Máximo 500 caracteres."),
  change_note: z.string().trim().max(200, "Máximo 200 caracteres."),
});

type ArticleValues = z.infer<typeof articleSchema>;

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10);
}

interface ArticleEditorFormProps {
  article?: KbArticle;
  onSaved?: () => void;
}

export function ArticleEditorForm({ article, onSaved }: ArticleEditorFormProps) {
  const router = useRouter();
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle(article?.id ?? 0);
  const isEdit = article !== undefined;
  const { data: categories = [] } = useCategories();

  // Incluye la categoría actual si no está en el catálogo (artículos viejos).
  const categoryOptions = article?.category
    ? categories.some((c) => c.value === article.category)
      ? categories
      : [...categories, { value: article.category, label: article.category }]
    : categories;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ArticleValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: article?.title ?? "",
      body: article?.body ?? "",
      category: article?.category ?? "",
      tags: article?.tags.join(", ") ?? "",
      change_note: "",
    },
  });

  const onSubmit = async (values: ArticleValues) => {
    try {
      if (isEdit && article) {
        await updateArticle.mutateAsync({
          title: values.title,
          body: values.body,
          category: values.category || undefined,
          tags: parseTags(values.tags),
          change_note: values.change_note || undefined,
        });
        toast.success("Artículo actualizado");
        onSaved?.();
      } else {
        const created = await createArticle.mutateAsync({
          title: values.title,
          body: values.body,
          category: values.category || undefined,
          tags: parseTags(values.tags),
        });
        toast.success("Borrador creado");
        router.push(`/app/knowledge/articles/${created.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el artículo.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="article-title">Título</Label>
        <Input
          id="article-title"
          placeholder="Título del artículo"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "article-title-error" : undefined}
          {...register("title")}
        />
        {errors.title ? (
          <p id="article-title-error" className="text-xs text-destructive">
            {errors.title.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="article-body">Contenido</Label>
        <Textarea
          id="article-body"
          rows={12}
          placeholder="Escribí el contenido del artículo…"
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={errors.body ? "article-body-error" : undefined}
          {...register("body")}
        />
        {errors.body ? (
          <p id="article-body-error" className="text-xs text-destructive">
            {errors.body.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label id="article-category-label">Categoría</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="article-category" aria-labelledby="article-category-label" className="w-full">
                  <SelectValue placeholder="Elegí una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category ? (
            <p className="text-xs text-destructive">{errors.category.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="article-tags">Etiquetas</Label>
          <Input
            id="article-tags"
            placeholder="Ej.: pago, tarjeta (separadas por coma)"
            aria-invalid={errors.tags ? true : undefined}
            {...register("tags")}
          />
          {errors.tags ? (
            <p className="text-xs text-destructive">{errors.tags.message}</p>
          ) : null}
        </div>
      </div>

      {isEdit ? (
        <div className="space-y-2">
          <Label htmlFor="article-change-note">Nota del cambio</Label>
          <Input
            id="article-change-note"
            placeholder="Ej.: actualizado el procedimiento de reembolso"
            aria-invalid={errors.change_note ? true : undefined}
            {...register("change_note")}
          />
          {errors.change_note ? (
            <p className="text-xs text-destructive">{errors.change_note.message}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
          {isSubmitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear artículo"}
        </Button>
        {isEdit && onSaved ? (
          <Button type="button" variant="outline" onClick={onSaved}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
