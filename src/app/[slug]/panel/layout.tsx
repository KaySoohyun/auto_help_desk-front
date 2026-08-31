import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PersonaShell } from "@/components/layout/PersonaShell";
import { getTenantBySlug } from "@/lib/tenant/server";

export const metadata: Metadata = {
  title: "Help Desk · Portal de personas",
};

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function PanelLayout({ children, params }: Props) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) {
    notFound();
  }
  return <PersonaShell slug={slug}>{children}</PersonaShell>;
}
