import type { Metadata } from "next";
import { PersonaShell } from "@/components/layout/PersonaShell";

export const metadata: Metadata = {
  title: "Soporte · Portal de personas",
};

export default function PersonasLayout({ children }: { children: React.ReactNode }) {
  return <PersonaShell>{children}</PersonaShell>;
}
