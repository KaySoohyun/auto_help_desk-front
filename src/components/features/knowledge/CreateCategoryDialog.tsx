"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateKbCategory } from "@/hooks/knowledge/useKbCategories";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Ingresá un nombre.").max(100, "Máximo 100 caracteres."),
});

type CategoryValues = z.infer<typeof categorySchema>;

export function CreateCategoryDialog({ trigger }: { trigger?: React.ReactNode }) {
  const createCategory = useCreateKbCategory();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryValues>({ resolver: zodResolver(categorySchema) });

  const onSubmit = async (values: CategoryValues) => {
    try {
      await createCategory.mutateAsync(values.name);
      toast.success("Categoría creada");
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear la categoría.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button variant="outline"><PlusIcon aria-hidden /> Nueva categoría</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva categoría</DialogTitle>
          <DialogDescription>
            Creá una categoría para organizar los artículos de la base de conocimiento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="category-name">Nombre</Label>
            <Input
              id="category-name"
              placeholder="Ej.: Facturación"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "category-name-error" : undefined}
              {...register("name")}
            />
            {errors.name ? (
              <p id="category-name-error" className="text-xs text-destructive">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
              {isSubmitting ? "Creando…" : "Crear categoría"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
