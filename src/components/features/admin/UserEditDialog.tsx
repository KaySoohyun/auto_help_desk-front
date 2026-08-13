"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2Icon, SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useUpdateAdminUser } from "@/hooks/admin/useUpdateAdminUser";
import { useSessionStore } from "@/stores/session.store";
import { ROLE_LABELS } from "@/components/features/admin/roleLabels";
import type { AdminUser } from "@/types/admin.types";
import type { UserRole } from "@/types/auth.types";

export function UserEditDialog({
  user,
  open,
  onOpenChange,
  isPlatformAdmin,
  onSaved,
}: {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPlatformAdmin: boolean;
  onSaved?: () => void;
}) {
  const sessionUser = useSessionStore((s) => s.user);
  const updateUser = useUpdateAdminUser(user.id);
  const isSelf = sessionUser?.id === user.id;

  const [role, setRole] = useState<UserRole>(user.role);
  const [isActive, setIsActive] = useState(user.is_active);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);

  const roleOptions: UserRole[] = isPlatformAdmin
    ? ["platform_admin", "tenant_admin", "supervisor", "agent"]
    : ["tenant_admin", "supervisor", "agent"];

  const hasChanges = role !== user.role || isActive !== user.is_active;

  const commit = async () => {
    try {
      await updateUser.mutateAsync({
        role: role !== user.role ? role : undefined,
        is_active: isActive !== user.is_active ? isActive : undefined,
      });
      toast.success("Usuario actualizado");
      setConfirmingDeactivate(false);
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setConfirmingDeactivate(false);
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el usuario.");
    }
  };

  const handleSave = () => {
    if (!hasChanges) {
      onOpenChange(false);
      return;
    }
    if (!isActive && user.is_active && !isSelf) {
      setConfirmingDeactivate(true);
      return;
    }
    void commit();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-role-${user.id}`}>Rol</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger id={`edit-role-${user.id}`} className="w-full">
                  <SelectValue />
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

            <div className="flex items-center gap-2">
              <Checkbox
                id={`edit-active-${user.id}`}
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
                disabled={isSelf}
              />
              <Label htmlFor={`edit-active-${user.id}`} className="font-normal">
                Usuario activo
              </Label>
            </div>
            {isSelf ? (
              <p className="text-xs text-muted-foreground">
                No podés desactivar tu propia cuenta.
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateUser.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateUser.isPending}>
              {updateUser.isPending ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
              ) : (
                <SaveIcon aria-hidden />
              )}
              {updateUser.isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmingDeactivate} onOpenChange={setConfirmingDeactivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              {user.email} no podrá iniciar sesión hasta que lo vuelvas a activar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={updateUser.isPending}>
                Cancelar
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={() => void commit()} disabled={updateUser.isPending}>
                {updateUser.isPending ? (
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                ) : null}
                Desactivar
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
