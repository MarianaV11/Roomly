"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { TextField } from "@/components/text-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/store/auth.store";

import { useToken } from "../hooks/use-token";
import {
  loginSchema,
  registerSchema,
  type LoginValues,
  type RegisterValues,
} from "../schemas/auth.schema";
import { login, register } from "../services/auth.service";
import { SubmitButton } from "./submit-button";

type AuthCardProps = {
  title: string;
  description: string;
  submitLabel: string;
  submitting: boolean;
  rootError?: string;
  footer: React.ReactNode;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  children: React.ReactNode;
};

function AuthCard(props: AuthCardProps) {
  const router = useRouter();
  const token = useToken();

  // Logged in (just now, or already) → go to the chat.
  useEffect(() => {
    if (token) router.replace("/");
  }, [token, router]);

  return (
    <Card className="w-full max-w-sm shadow-lg shadow-black/5 motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
      <CardHeader>
        <CardTitle className="font-heading text-xl font-bold">{props.title}</CardTitle>
        <CardDescription>{props.description}</CardDescription>
      </CardHeader>

      <form onSubmit={props.onSubmit} noValidate>
        <CardContent className="flex flex-col gap-4">
          {props.children}
          {props.rootError && (
            <p
              role="alert"
              className="text-sm text-destructive motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:fade-in"
            >
              {props.rootError}
            </p>
          )}
        </CardContent>

        <CardFooter className="mt-6 flex flex-col gap-6">
          <SubmitButton
            text={props.submitting ? "Aguarde…" : props.submitLabel}
            disabled={props.submitting}
          />
          <p className="text-sm text-muted-foreground">{props.footer}</p>
        </CardFooter>
      </form>
    </Card>
  );
}

const linkClass = "text-primary underline-offset-4 hover:underline";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Algo deu errado. Tente de novo.";
}

export function LoginForm() {
  const setToken = useAuth((state) => state.setToken);
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    try {
      setToken((await login(email, password)).access_token);
    } catch (error) {
      form.setError("root", { message: errorMessage(error) });
    }
  });

  return (
    <AuthCard
      title="Entrar"
      description="Use seu e-mail e senha para acessar suas conversas."
      submitLabel="Entrar"
      submitting={isSubmitting}
      rootError={errors.root?.message}
      onSubmit={onSubmit}
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/register" className={linkClass}>
            Criar conta
          </Link>
        </>
      }
    >
      <TextField
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        error={errors.email}
        registration={form.register("email")}
      />
      <TextField
        id="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        error={errors.password}
        registration={form.register("password")}
      />
    </AuthCard>
  );
}

export function RegisterForm() {
  const setToken = useAuth((state) => state.setToken);
  const form = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ name, email, password }) => {
    try {
      await register(name, email, password);
      setToken((await login(email, password)).access_token);
    } catch (error) {
      form.setError("root", { message: errorMessage(error) });
    }
  });

  return (
    <AuthCard
      title="Criar conta"
      description="Leva menos de um minuto."
      submitLabel="Criar conta"
      submitting={isSubmitting}
      rootError={errors.root?.message}
      onSubmit={onSubmit}
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className={linkClass}>
            Entrar
          </Link>
        </>
      }
    >
      <TextField
        id="name"
        label="Nome"
        autoComplete="name"
        error={errors.name}
        registration={form.register("name")}
      />
      <TextField
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        error={errors.email}
        registration={form.register("email")}
      />
      <TextField
        id="password"
        label="Senha"
        type="password"
        autoComplete="new-password"
        error={errors.password}
        registration={form.register("password")}
      />
    </AuthCard>
  );
}
