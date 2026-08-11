"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} passHref legacyBehavior>
      <Button variant="ghost" size="sm">
        <ArrowLeftIcon aria-hidden />
        {label}
      </Button>
    </Link>
  );
}
