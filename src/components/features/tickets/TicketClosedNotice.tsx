"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function TicketClosedNotice() {
  return (
    <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
      <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        Este ticket está cerrado. No se pueden enviar más mensajes.
      </AlertDescription>
    </Alert>
  );
}
