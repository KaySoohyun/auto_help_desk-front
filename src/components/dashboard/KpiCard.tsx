"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

export function KpiCard({ title, value, subtitle, className }: KpiCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        {subtitle && <CardDescription className="text-xs text-muted-foreground">{subtitle}</CardDescription>}
      </CardHeader>
      <div className="mt-2 text-2xl font-bold">
        {typeof value === "number" ? value : value}
      </div>
    </Card>
  );
}