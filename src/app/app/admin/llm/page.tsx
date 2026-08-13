import { AdminLlmView } from "@/components/features/admin/AdminLlmView";
import { AdminNav } from "@/components/features/admin/AdminNav";
import { BackLink } from "@/components/features/tickets/BackLink";

export default function AdminLlmPage() {
  return (
    <div className="space-y-4">
      <BackLink href="/app" label="Volver al inicio" />
      <AdminNav />
      <AdminLlmView />
    </div>
  );
}
