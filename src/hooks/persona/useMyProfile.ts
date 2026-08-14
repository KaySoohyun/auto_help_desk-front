"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import type { PersonaProfile } from "@/types/persona.types";

export function useMyProfile() {
  return useQuery({
    queryKey: ["persona", "profile"],
    queryFn: ({ signal }) => bffFetch<PersonaProfile>("/api/bff/me/profile", { signal }),
  });
}
