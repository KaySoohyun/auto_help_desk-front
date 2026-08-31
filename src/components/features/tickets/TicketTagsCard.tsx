"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Plus, X } from "lucide-react";
import { useTicketTags } from "@/hooks/tickets/useTicketTags";
import { useAddTicketTag } from "@/hooks/tickets/useAddTicketTag";
import { useRemoveTicketTag } from "@/hooks/tickets/useRemoveTicketTag";
import { useTags } from "@/hooks/tickets/useTags";
import { useCreateTag } from "@/hooks/tickets/useCreateTag";
import { toast } from "sonner";
import type { Tag } from "@/types/tag.types";

interface TicketTagsCardProps {
  ticketId: number;
}

export function TicketTagsCard({ ticketId }: TicketTagsCardProps) {
  const { data: tags } = useTicketTags(ticketId);
  const addTag = useAddTicketTag();
  const removeTag = useRemoveTicketTag();
  const createTag = useCreateTag();
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searched = useTags(adding ? query : "");

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const isOnTicket = (tagId: number) => tags?.some((t) => t.id === tagId) ?? false;

  const handleSelectExisting = async (tag: Tag) => {
    if (isOnTicket(tag.id)) return;
    try {
      await addTag.mutateAsync({ ticketId, tagId: tag.id });
      setQuery("");
      toast.success("Tag agregado");
    } catch {
      toast.error("Error al agregar tag");
    }
  };

  const handleCreateNew = async () => {
    const name = query.trim();
    if (!name) return;
    try {
      const created = await createTag.mutateAsync({ name });
      await addTag.mutateAsync({ ticketId, tagId: created.id });
      setQuery("");
      toast.success("Tag creado y agregado");
    } catch {
      toast.error("Error al crear tag");
    }
  };

  const handleAccept = async () => {
    const name = query.trim();
    if (!name) return;

    const exact = (searched.data ?? []).find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    );
    if (exact && !isOnTicket(exact.id)) {
      await handleSelectExisting(exact);
      return;
    }
    if (exact) {
      toast.info("La tag ya está en el ticket");
      return;
    }
    await handleCreateNew();
  };

  const handleRemoveTag = async (tagId: number) => {
    try {
      await removeTag.mutateAsync({ ticketId, tagId });
      toast.success("Tag removido");
    } catch {
      toast.error("Error al remover tag");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Tags</CardTitle>
        {!adding && (
          <CardAction>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAdding(true);
                setQuery("");
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
            >
              <Plus className="mr-1 size-4" />
              Agregar tag
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {tags && tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                {tag.name}
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-1 hover:text-destructive"
                  aria-label={`Remover tag ${tag.name}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin tags</p>
        )}

        {adding && (
          <div className="space-y-3">
            <div ref={containerRef} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAccept();
                  }
                }}
                placeholder="Buscar o crear tag"
                className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
              />
              {open && query.trim().length >= 3 && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-popover shadow-md">
                  {searched.isFetching ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      Buscando…
                    </div>
                  ) : (searched.data ?? []).length > 0 ? (
                    <ul>
                      {searched.data?.map((tag) => {
                        const onTicket = isOnTicket(tag.id);
                        return (
                          <li key={tag.id}>
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectExisting(tag);
                                setOpen(false);
                              }}
                              disabled={onTicket}
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <span>
                                {tag.name}
                                {onTicket && <span className="ml-2 text-xs text-muted-foreground">(ya agregada)</span>}
                              </span>
                              {onTicket && <Check className="size-4 text-primary" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAdding(false);
                  setOpen(false);
                }}
              >
                <X className="mr-1 size-4" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={
                  query.trim().length === 0 ||
                  createTag.isPending ||
                  addTag.isPending
                }
              >
                <Check className="mr-1 size-4" />
                Aceptar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
