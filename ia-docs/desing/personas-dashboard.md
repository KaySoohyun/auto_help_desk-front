import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AppHeader from "@/components/AppHeader";
import TicketCard from "@/components/TicketCard";
import EmptyState from "@/components/EmptyState";
import CreateTicketModal from "@/components/CreateTicketModal";
import { Button } from "@/components/ui/button";
import { Plus, Inbox, Search, SlidersHorizontal } from "lucide-react";
import { TICKET_STATUSES, statusMeta } from "@/lib/ticketConfig";
import { cn } from "@/lib/utils";

const FILTERS = [{ key: "all", label: "Todos" }, ...TICKET_STATUSES.map((s) => ({ key: s.key, label: s.label }))];

export default function PersonasDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [company, setCompany] = useState(null);

  const loadTickets = useCallback(async () => {
    try {
      const list = await base44.entities.Ticket.list("-created_date", 100);
      setTickets(list || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
    const unsub = base44.entities.Ticket.subscribe(() => loadTickets());
    return unsub;
  }, [loadTickets]);

  useEffect(() => {
    const companyId = user?.data?.company_id;
    if (companyId) {
      base44.entities.Company.list().then((cs) => {
        setCompany(cs.find((c) => c.id === companyId) || null);
      });
    }
  }, [user]);

  const activeTickets = tickets.filter((t) => t.status === "abierto" || t.status === "en_proceso").length;

  const counts = TICKET_STATUSES.reduce((acc, s) => {
    acc[s.key] = tickets.filter((t) => t.status === s.key).length;
    return acc;
  }, {});

  const filtered = tickets.filter((t) => {
    const matchesFilter = filter === "all" || t.status === filter;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  const handleCreate = async ({ title, description, category, priority }) => {
    const agentName = company?.support_agent_name || "Equipo de soporte";
    const agentRole = company?.support_agent_role || "Soporte";
    const agentAvatar = company?.support_agent_avatar_url || "";
    const ticket = await base44.entities.Ticket.create({
      title,
      description,
      category,
      priority,
      status: "abierto",
      company_id: user?.data?.company_id || "",
      company_name: user?.data?.company_name || company?.name || "",
      assigned_agent_name: agentName,
      assigned_agent_role: agentRole,
      assigned_agent_avatar_url: agentAvatar,
      estimated_hours: 24,
    });
    await base44.entities.Message.create({
      ticket_id: ticket.id,
      ticket_owner_id: user.id,
      sender: "user",
      author_name: user?.data?.name || user?.full_name || "Usuario",
      content: description,
      attachments: [],
    });
    setModalOpen(false);
    navigate(`/app/tickets/${ticket.id}`);
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <AppHeader activeTickets={activeTickets} variant="persona" />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Hola, {user?.data?.name || user?.full_name || ""} 👋
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Gestiona tus incidencias y conversa con el equipo de soporte.
            </p>
          </div>
          <Button size="lg" className="h-12 rounded-xl shadow-sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Crear nuevo ticket
          </Button>
        </div>


        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar tickets por título o descripción…"
              className="w-full h-11 pl-10 pr-3 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  filter === f.key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
                {f.key !== "all" && (
                  <span className={cn("text-xs", filter === f.key ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {counts[f.key] || 0}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={tickets.length === 0 ? "Aún no tienes tickets" : "Sin resultados"}
            description={tickets.length === 0 ? "Crea tu primer ticket de soporte y nuestro equipo te ayudará." : "Prueba con otro filtro o término de búsqueda."}
            action={tickets.length === 0 ? <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-1.5" />Crear ticket</Button> : null}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((t) => (
              <TicketCard key={t.id} ticket={t} />
            ))}
          </div>
        )}
      </main>

      <CreateTicketModal open={modalOpen} onOpenChange={setModalOpen} onCreate={handleCreate} company={company} />
    </div>
  );
}