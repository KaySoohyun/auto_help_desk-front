import { AuditEventsView } from "@/components/features/audit/AuditEventsView";
import { BackLink } from "@/components/features/tickets/BackLink";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const plain: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") plain[key] = value;
  }

  return (
    <div className="space-y-4">
      <BackLink href="/app" label="Volver al inicio" />
      <AuditEventsView searchParams={plain} />
    </div>
  );
}
