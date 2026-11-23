"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useToken } from "../hooks/use-token";

/** Renders children only for logged-in users; everyone else goes to /login. */
export function RequireAuth({ children }: { children: (token: string) => React.ReactNode }) {
  const token = useToken();
  const router = useRouter();

  useEffect(() => {
    if (token === null) router.replace("/login");
  }, [token, router]);

  return token ? children(token) : null;
}
