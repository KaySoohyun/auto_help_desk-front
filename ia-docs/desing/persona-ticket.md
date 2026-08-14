import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AppHeader from "@/components/AppHeader";
import ChatPanel from "@/components/ChatPanel";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatDateTime } from "@/lib/ticketConfig";
import { Calendar, Clock, Tag, UserCheck, Building2, MessageSquare } from "lucide-react";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const replyLock = useRef(false);

  const loadTicket = useCallback(async () => {
    try {
      const t = await base44.entities.Ticket.get(id);
      setTicket(t);
    } catch {
      setTicket(null);
    }
  }, [id]);

  const loadMessages = useCallback(async () => {
    try {
      const list = await base44.entities.Message.filter({ ticket_id: id }, "created_date", 200);
      setMessages(list || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicket();
    loadMessages();
    const unsubM = base44.entities.Message.subscribe((event) => {
      if (event?.data?.ticket_id === id || event?.type) loadMessages();
    });
    const unsubT = base44.entities.Ticket.subscribe(() => loadTicket());
    return () => { unsubM(); unsubT(); };
  }, [loadTicket, loadMessages, id]);

  const agent = {
    name: ticket?.assigned_agent_name,
    role: ticket?.assigned_agent_role,
    avatar: ticket?.assigned_agent_avatar_url,
  };

  const handleSend = async (text, attachments) => {
    if (replyLock.current) return;
    setSending(true);
    replyLock.current = true;
    try {
      await base44.entities.Message.create({
        ticket_id: id,
        ticket_owner_id: user.id,
        sender: "user",
        author_name: user?.data?.name || user?.full_name || "Usuario",
        content: text,
        attachments: attachments || [],
      });
      // Agent auto-reply (IA contextual)
      if (ticket?.status === "abierto") {
        await base44.entities.Ticket.update(id, { status: "en_proceso" });
      }
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `Eres ${agent.name || "un agente de soporte"}, ${agent.role || "soporte"} de la empresa ${ticket?.company_name || "Soporte"}. Un cliente abrió el ticket "${ticket?.title}" (categoría: ${ticket?.category}). Acaba de escribir: "${text}". Responde de forma breve (2-3 frases), profesional, empática y en español, ofreciendo un siguiente paso claro. No inventes soluciones técnicas imposibles.`,
        });
        const reply = typeof res === "string" ? res : res?.response || res?.text || "Gracias por tu mensaje. Lo estamos revisando y te responderemos a la brevedad.";
        await base44.entities.Message.create({
          ticket_id: id,
          ticket_owner_id: user.id,
          sender: "agent",
          author_name: agent.name || "Soporte",
          author_avatar_url: agent.avatar || "",
          content: reply,
          attachments: [],
        });
      } catch {
        await base44.entities.Message.create({
          ticket_id: id,
          ticket_owner_id: user.id,
          sender: "agent",
          author_name: agent.name || "Soporte",
          content: "Gracias por tu mensaje. Hemos recibido tu consulta y el equipo la está revisando. Te responderemos a la brevedad.",
          attachments: [],
        });
      }
    } finally {
      setSending(false);
      replyLock.current = false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20">
        <AppHeader variant="persona" />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <Skeleton className="h-32 rounded-2xl mb-4" />
          <Skeleton className="h-96 rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-muted/20">
        <AppHeader variant="persona" />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-20 text-center">
          <h2 className="text-xl font-semibold">Ticket no encontrado</h2>
          <p className="text-muted-foreground mt-1">Es posible que haya sido eliminado o que no tengas acceso.</p>
          <Button className="mt-5" onClick={() => navigate("/app")}>Volver al panel</Button>
        </main>
      </div>
    );
  }

  const ticketNumber = `#${String(ticket.id).slice(-6).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <AppHeader variant="persona" />

      <main className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* Header */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 mb-4">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-xs font-mono text-muted-foreground">{ticketNumber}</span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{ticket.title}</h1>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Abierto {formatDate(ticket.created_date)}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Actualizado {formatDate(ticket.updated_date)}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-4">
          {/* Main: description + chat */}
          <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden min-h-[60vh]">
            <div className="px-5 sm:px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Conversación
              </h2>
            </div>
            <div className="px-5 sm:px-6 py-4 border-b border-border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Descripción inicial</p>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
            </div>
            <div className="flex-1 min-h-0">
              <ChatPanel messages={messages} agent={agent} onSend={handleSend} sending={sending} />
            </div>
          </div>

          {/* Side info */}
          <aside className="rounded-2xl border border-border bg-card p-5 h-fit lg:sticky lg:top-20">
            <h3 className="text-sm font-semibold text-foreground mb-2">Información</h3>
            <div className="divide-y divide-border">
              <InfoRow icon={Tag} label="Categoría" value={ticket.category} />
              <InfoRow icon={Building2} label="Empresa" value={ticket.company_name || "—"} />
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3">Asignado a</p>
              <div className="flex items-center gap-3">
                <Avatar className="w-11 h-11 rounded-full">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {(agent.name || "S").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{agent.name || "Sin asignar"}</p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> {agent.role || "Soporte"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border divide-y divide-border">
              <InfoRow icon={Calendar} label="Creado" value={formatDateTime(ticket.created_date)} />
              <InfoRow icon={Clock} label="Última modificación" value={formatDateTime(ticket.updated_date)} />
              <InfoRow icon={Clock} label="Tiempo estimado" value={ticket.estimated_hours ? `${ticket.estimated_hours} h` : "—"} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}