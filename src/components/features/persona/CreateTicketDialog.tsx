"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateMyTicket } from "@/hooks/persona/useMyTickets";
import { useCategories } from "@/hooks/tickets/useCategories";
import { useTenantSlug } from "@/hooks/useTenantSlug";
import type { TicketPriority } from "@/types/ticket.types";

const createSchema = z.object({
  subject: z.string().trim().min(1, "Ingresá un asunto.").max(200, "Máximo 200 caracteres."),
  description: z.string().trim().min(1, "Ingresá una descripción.").max(4000, "Máximo 4000 caracteres."),
  category: z.string().trim().max(100, "Máximo 100 caracteres.").optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

type CreateValues = z.infer<typeof createSchema>;

const PRIORITY_OPTIONS: Array<{ value: TicketPriority; label: string }> = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

export function CreateTicketDialog({ trigger }: { trigger?: React.ReactNode }) {
  const router = useRouter();
  const slug = useTenantSlug();
  const createTicket = useCreateMyTicket();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { subject: "", description: "", category: "", priority: undefined },
  });

  const onSubmit = async (values: CreateValues) => {
    try {
      const created = await createTicket.mutateAsync({
        subject: values.subject,
        description: values.description,
        category: values.category || undefined,
        priority: values.priority,
      });
      toast.success("Ticket creado");
      reset();
      setOpen(false);
      router.push(`/${slug}/panel/tickets/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el ticket.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button>Crear nuevo ticket</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo ticket</DialogTitle>
          <DialogDescription>
            Contanos tu problema y el equipo de soporte te va a responder.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="persona-subject">Asunto</Label>
            <Input
              id="persona-subject"
              placeholder="Resumen breve del problema"
              aria-invalid={errors.subject ? true : undefined}
              aria-describedby={errors.subject ? "persona-subject-error" : undefined}
              {...register("subject")}
            />
            {errors.subject ? (
              <p id="persona-subject-error" className="text-xs text-destructive">
                {errors.subject.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="persona-description">Descripción</Label>
            <Textarea
              id="persona-description"
              rows={5}
              placeholder="Describí el problema con el mayor detalle posible"
              aria-invalid={errors.description ? true : undefined}
              aria-describedby={errors.description ? "persona-description-error" : undefined}
              {...register("description")}
            />
            {errors.description ? (
              <p id="persona-description-error" className="text-xs text-destructive">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="persona-category">Categoría</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={categoriesLoading}
                  >
                    <SelectTrigger id="persona-category" aria-label="Categoría">
                      <SelectValue placeholder="Elegí una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="persona-priority">Prioridad</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="persona-priority" aria-label="Prioridad">
                      <SelectValue placeholder="Elegí una prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
              {isSubmitting ? "Creando…" : "Crear ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
