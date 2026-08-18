import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { getTenantBySlug } from "@/lib/tenant/server";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Auto Help Desk",
};

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function AppLayout({ children, params }: Props) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) {
    notFound();
  }
  return <AppShell slug={slug} tenantName={tenant.name}>{children}</AppShell>;
}
