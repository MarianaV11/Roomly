"use client";

import { useEffect } from "react";

import { AUTH_STORAGE_KEY, useAuth } from "@/store/auth.store";

/** Loads the persisted session after mount and keeps tabs in sync (logout in one logs out all). */
export function AuthHydration() {
  useEffect(() => {
    useAuth.persist.rehydrate();

    const onStorage = (event: StorageEvent) => {
      if (event.key === AUTH_STORAGE_KEY) useAuth.persist.rehydrate();
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}
