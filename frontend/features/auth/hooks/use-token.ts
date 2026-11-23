"use client";

import { useAuth } from "@/store/auth.store";

export function useToken(): string | null | undefined {
  return useAuth((state) => (state.hydrated ? state.token : undefined));
}
