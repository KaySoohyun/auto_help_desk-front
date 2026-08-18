"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2Icon, PlusIcon } from "lucide-react";
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
import { useCreateTicket } from "@/hooks/tickets/useCreateTicket";
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

export function CreateTicketDialog() {
  const router = useRouter();
  const slug = useTenantSlug();
  const createTicket = useCreateTicket();
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
      router.push(`/${slug}/app/tickets/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el ticket.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon aria-hidden />
          Nuevo ticket
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo ticket</DialogTitle>
          <DialogDescription>
            Creá un ticket de soporte. El cliente lo verá en su bandeja.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="ticket-subject">Asunto</Label>
            <Input
              id="ticket-subject"
              placeholder="Resumen breve del problema"
              aria-invalid={errors.subject ? true : undefined}
              aria-describedby={errors.subject ? "ticket-subject-error" : undefined}
              {...register("subject")}
            />
            {errors.subject ? (
              <p id="ticket-subject-error" className="text-xs text-destructive">
                {errors.subject.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-description">Descripción</Label>
            <Textarea
              id="ticket-description"
              rows={5}
              placeholder="Detallá el problema"
              aria-invalid={errors.description ? true : undefined}
              aria-describedby={errors.description ? "ticket-description-error" : undefined}
              {...register("description")}
            />
            {errors.description ? (
              <p id="ticket-description-error" className="text-xs text-destructive">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label id="ticket-category-label">Categoría</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={categoriesLoading}>
                    <SelectTrigger aria-labelledby="ticket-category-label" className="w-full">
                      <SelectValue placeholder="Seleccioná" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
              <Label id="ticket-priority-label">Prioridad</Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger aria-labelledby="ticket-priority-label" className="w-full">
                      <SelectValue placeholder="Seleccioná" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
