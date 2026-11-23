import type { Metadata } from "next";

import { RegisterForm } from "@/features/auth";

export const metadata: Metadata = { title: "Criar conta · Roomly" };

export default function RegisterPage() {
  return <RegisterForm />;
}
