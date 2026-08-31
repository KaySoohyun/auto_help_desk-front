import { TicketDetailView } from "@/components/features/tickets/TicketDetailView";
import { BackLink } from "@/components/features/tickets/BackLink";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ slug: string; ticketId: string }>;
}) {
  const { slug, ticketId } = await params;
  const numericId = Number.parseInt(ticketId, 10);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Ticket inválido.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink href={`/${slug}/app/tickets`} label="Volver a tickets" />

      <TicketDetailView ticketId={numericId} />
    </div>
  );
}
