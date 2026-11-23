import type { Metadata } from "next";

import { LoginForm } from "@/features/auth";

export const metadata: Metadata = { title: "Entrar · Roomly" };

export default function LoginPage() {
  return <LoginForm />;
}
