"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2Icon, UserPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAdminUser } from "@/hooks/admin/useCreateAdminUser";
import { ROLE_LABELS } from "@/components/features/admin/roleLabels";
import type { UserRole } from "@/types/auth.types";

const createUserSchema = z.object({
  email: z.string().trim().email("Ingresá un email válido.").max(255, "Máximo 255 caracteres."),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres.")
    .max(128, "Máximo 128 caracteres."),
  tenant_id: z.string().trim().max(64).optional(),
});

type CreateUserValues = z.infer<typeof createUserSchema>;

export function UserCreateForm({
  isPlatformAdmin,
  onSaved,
}: {
  isPlatformAdmin: boolean;
  onSaved?: () => void;
}) {
  const createUser = useCreateAdminUser();
  const [role, setRole] = useState<UserRole>("agent");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      password: "",
      tenant_id: "",
    },
  });

  const roleOptions: UserRole[] = isPlatformAdmin
    ? ["platform_admin", "tenant_admin", "supervisor", "agent"]
    : ["tenant_admin", "supervisor", "agent"];

  const onSubmit = async (values: CreateUserValues) => {
    try {
      await createUser.mutateAsync({
        email: values.email,
        password: values.password,
        role,
        tenant_id: values.tenant_id?.trim() || undefined,
      });
      toast.success("Usuario creado");
      onSaved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el usuario.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="user-email">Email</Label>
        <Input
          id="user-email"
          type="email"
          placeholder="usuario@example.com"
          autoComplete="off"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "user-email-error" : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <p id="user-email-error" className="text-xs text-destructive">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-password">Contraseña</Label>
        <Input
          id="user-password"
          type="password"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "user-password-error" : undefined}
          {...register("password")}
        />
        {errors.password ? (
          <p id="user-password-error" className="text-xs text-destructive">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-role">Rol</Label>
        <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
          <SelectTrigger id="user-role" className="w-full">
            <SelectValue placeholder="Seleccioná un rol" />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {ROLE_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPlatformAdmin ? (
        <div className="space-y-2">
          <Label htmlFor="user-tenant-id">Tenant ID</Label>
          <Input
            id="user-tenant-id"
            placeholder="tenant-abc"
            aria-invalid={errors.tenant_id ? true : undefined}
            aria-describedby="user-tenant-id-help"
            {...register("tenant_id")}
          />
          <p id="user-tenant-id-help" className="text-xs text-muted-foreground">
            Obligatorio para crear usuarios de otro tenant.
          </p>
          {errors.tenant_id ? (
            <p className="text-xs text-destructive">{errors.tenant_id.message}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
          ) : (
            <UserPlusIcon aria-hidden />
          )}
          {isSubmitting ? "Creando…" : "Crear usuario"}
        </Button>
      </div>
    </form>
  );
}
