"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Loader2Icon,
  MessageSquare,
  Send,
  Tag,
  UserCheck,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { TicketPriorityBadge, TicketStatusBadge } from "@/components/features/tickets/TicketBadges";
import { useMyTicket, useMyMessages, useSendMyMessage } from "@/hooks/persona/useMyTickets";
import { useMyProfile } from "@/hooks/persona/useMyProfile";
import { useSessionStore } from "@/stores/session.store";
import { categoryLabel } from "@/lib/constants/categories";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const messageSchema = z.object({
  body: z.string().trim().min(1, "Escribí un mensaje.").max(4000, "Máximo 4000 caracteres."),
});

type MessageValues = z.infer<typeof messageSchema>;

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function PersonaTicketDetail() {
  const params = useParams<{ ticketId: string; slug: string }>();
  const router = useRouter();
  const slug = params.slug;
  const ticketId = Number(params.ticketId);
  const myUserId = useSessionStore((s) => s.user?.id ?? null);
  const { data: profile } = useMyProfile();
  const { data: ticket, isLoading: ticketLoading, isError } = useMyTicket(ticketId);
  const { data: messages = [], isLoading: messagesLoading } = useMyMessages(ticketId);
  const sendMessage = useSendMyMessage(ticketId);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MessageValues>({ resolver: zodResolver(messageSchema) });

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const onSubmit = async (values: MessageValues) => {
    try {
      await sendMessage.mutateAsync(values.body);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
    }
  };

  if (ticketLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Skeleton className="mb-4 h-32 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h2 className="text-xl font-semibold">Ticket no encontrado</h2>
        <p className="mt-1 text-muted-foreground">Es posible que no exista o que no tengas acceso.</p>
        <Button className="mt-5" onClick={() => router.push(`/${slug}/panel`)}>
          Volver al panel
        </Button>
      </div>
    );
  }

  const company = profile?.company || profile?.tenant_name || "—";
  const isClosed = ticket.status === "closed";

  return (
    <main className="mx-auto max-w-6xl w-full flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 gap-2"
        onClick={() => router.push(`/${slug}/panel`)}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver al panel
      </Button>

      {/* Header */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            #{String(ticket.id).slice(-6).toUpperCase()}
          </span>
          <TicketStatusBadge
            status={ticket.status}
            label={ticket.status === "closed" ? "Resuelto" : undefined}
          />
          <TicketPriorityBadge priority={ticket.priority} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {ticket.subject}
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Main: description + chat */}
        <div className="flex min-h-[60vh] flex-col overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageSquare className="h-4 w-4" aria-hidden /> Conversación
            </h2>
          </div>
          <div className="border-b border-border bg-muted/30 px-5 py-4 sm:px-6">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Descripción inicial
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {ticket.description}
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:px-6">
            {messagesLoading ? (
              <div className="space-y-3" aria-busy="true">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-2/3 rounded-2xl" />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Todavía no hay mensajes. Escribí tu consulta.
              </p>
            ) : (
              messages.map((message) => {
                const isMine = message.author_id === myUserId;
                return (
                  <div
                    key={message.id}
                    className={cn("flex gap-3", isMine ? "justify-end" : "justify-start")}
                  >
                    {!isMine ? (
                      <Avatar className="mt-1 size-8 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          S
                        </AvatarFallback>
                      </Avatar>
                    ) : null}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5",
                        isMine
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm border border-border bg-muted/40"
                      )}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
                      <p
                        className={cn(
                          "mt-1 text-[11px]",
                          isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}
                      >
                        {isMine ? "Vos" : "Equipo de soporte"} · {formatDateTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={threadEndRef} />
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="border-t border-border p-4 sm:px-6"
            noValidate
          >
            <div className="flex items-end gap-2">
              <Textarea
                rows={2}
                placeholder={isClosed ? "Ticket resuelto" : "Escribí tu mensaje…"}
                disabled={isClosed}
                aria-label="Mensaje"
                className="flex-1 resize-none"
                {...register("body")}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isSubmitting || isClosed}
                aria-label="Enviar mensaje"
              >
                {isSubmitting ? (
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="size-4" aria-hidden />
                )}
              </Button>
            </div>
            {errors.body ? (
              <p className="mt-2 text-xs text-destructive">{errors.body.message}</p>
            ) : null}
            {isClosed ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Este ticket está resuelto. No se pueden enviar más mensajes.
              </p>
            ) : null}
          </form>
        </div>

        {/* Side info */}
        <aside className="h-fit rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-20">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Información</h3>
          <div className="divide-y divide-border">
            <InfoRow icon={Tag} label="Categoría" value={categoryLabel(ticket.category)} />
            <InfoRow icon={Building2} label="Empresa" value={company} />
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-3 text-xs text-muted-foreground">Asignado a</p>
            <div className="flex items-center gap-3">
              <Avatar className="size-11">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  S
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">Equipo de soporte</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <UserCheck className="h-3 w-3" aria-hidden /> Soporte
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 divide-y divide-border border-t border-border">
            <InfoRow icon={Calendar} label="Creado" value={formatDateTime(ticket.created_at)} />
            <InfoRow icon={Clock} label="Última modificación" value={formatDateTime(ticket.updated_at)} />
          </div>
        </aside>
      </div>
    </main>
  );
}
