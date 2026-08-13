import { AdminUsersView } from "@/components/features/admin/AdminUsersView";
import { BackLink } from "@/components/features/tickets/BackLink";

export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <BackLink href="/app" label="Volver al inicio" />
      <AdminUsersView />
    </div>
  );
}
