"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { useTicketTags } from "@/hooks/tickets/useTicketTags";
import { useAddTicketTag } from "@/hooks/tickets/useAddTicketTag";
import { useRemoveTicketTag } from "@/hooks/tickets/useRemoveTicketTag";
import { toast } from "sonner";

interface TicketTagsCardProps {
  ticketId: number;
}

export function TicketTagsCard({ ticketId }: TicketTagsCardProps) {
  const { data: tags, isLoading } = useTicketTags(ticketId);
  const addTag = useAddTicketTag();
  const removeTag = useRemoveTicketTag();
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTagId, setNewTagId] = useState<string>("");

  const handleAddTag = async () => {
    if (!newTagId) return;
    
    try {
      await addTag.mutateAsync({
        ticketId,
        tagId: parseInt(newTagId, 10),
      });
      setNewTagId("");
      setShowAddInput(false);
      toast.success("Tag agregado");
    } catch {
      toast.error("Error al agregar tag");
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    try {
      await removeTag.mutateAsync({ ticketId, tagId });
      toast.success("Tag removido");
    } catch {
      toast.error("Error al remover tag");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Tags</CardTitle>
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

        {showAddInput ? (
          <div className="flex gap-2">
            <input
              type="number"
              value={newTagId}
              onChange={(e) => setNewTagId(e.target.value)}
              placeholder="ID del tag"
              className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm"
            />
            <Button
              size="sm"
              onClick={handleAddTag}
              disabled={!newTagId || addTag.isPending}
            >
              Agregar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowAddInput(false);
                setNewTagId("");
              }}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddInput(true)}
          >
            <Plus className="mr-1 size-4" />
            Agregar tag
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
