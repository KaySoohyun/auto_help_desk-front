import { AdminCustomersView } from "@/components/features/admin/AdminCustomersView";
import { AdminNav } from "@/components/features/admin/AdminNav";
import { BackLink } from "@/components/features/tickets/BackLink";

export default function AdminCustomersPage() {
  return (
    <div className="space-y-4">
      <BackLink href="/app" label="Volver al inicio" />
      <AdminNav />
      <AdminCustomersView />
    </div>
  );
}