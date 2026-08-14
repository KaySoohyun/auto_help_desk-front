"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Mail, User, Tag } from "lucide-react";
import type { Customer } from "@/types/customer.types";

interface CustomerCardProps {
  customer: Customer | null | undefined;
  isLoading?: boolean;
}

export function CustomerCard({ customer, isLoading }: CustomerCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!customer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sin información de cliente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <span className="text-sm">{customer.name}</span>
        </div>
        {customer.email && (
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <span className="text-sm">{customer.email}</span>
          </div>
        )}
        {customer.company && (
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <span className="text-sm">{customer.company}</span>
          </div>
        )}
        {customer.plan && (
          <div className="flex items-center gap-2">
            <Tag className="size-4 text-muted-foreground" />
            <span className="text-sm capitalize">{customer.plan}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
