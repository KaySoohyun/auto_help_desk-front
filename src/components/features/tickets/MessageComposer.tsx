"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2Icon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSendMessage } from "@/hooks/tickets/useSendMessage";

const messageSchema = z.object({
  body: z.string().trim().min(1, "Escribí un mensaje.").max(5000, "Máximo 5000 caracteres."),
});

type MessageValues = z.infer<typeof messageSchema>;

export function MessageComposer({
  ticketId,
  initialValue,
}: {
  ticketId: number;
  initialValue?: string;
}) {
  const sendMessage = useSendMessage(ticketId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MessageValues>({ resolver: zodResolver(messageSchema) });

  useEffect(() => {
    if (initialValue && initialValue.trim()) {
      setValue("body", initialValue, { shouldDirty: true, shouldValidate: false });
    }
  }, [initialValue, setValue]);

  const onSubmit = async (values: MessageValues) => {
    try {
      await sendMessage.mutateAsync(values.body);
      toast.success("Mensaje enviado");
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2" noValidate>
      <Textarea
        rows={3}
        placeholder="Escribí tu respuesta…"
        aria-label="Respuesta"
        aria-invalid={errors.body ? true : undefined}
        aria-describedby={errors.body ? "message-body-error" : undefined}
        disabled={isSubmitting}
        {...register("body")}
      />
      {errors.body ? (
        <p id="message-body-error" className="text-xs text-destructive">
          {errors.body.message}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
          <SendIcon aria-hidden />
          {isSubmitting ? "Enviando…" : "Responder"}
        </Button>
      </div>
    </form>
  );
}
