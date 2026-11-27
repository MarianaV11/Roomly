"use client";

import { RiSettings3Line } from "@remixicon/react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserAvatar, type User } from "@/features/users";
import { cn } from "@/lib/utils";

import { DeleteAccountDialog } from "./delete-account-dialog";
import { ProfilePhoto } from "./profile-photo";
import { ThemeSwitch } from "./theme-switch";

function Group({
  id,
  title,
  danger,
  children,
}: {
  id: string;
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h3
        id={id}
        className={cn(
          "text-xs font-medium tracking-wide uppercase",
          danger ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {title}
      </h3>
      <div className={cn("divide-y rounded-lg border", danger && "border-destructive/30")}>
        {children}
      </div>
    </section>
  );
}

function Row({
  title,
  description,
  htmlFor,
  children,
}: {
  title: string;
  description: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const Text = htmlFor ? "label" : "div";

  return (
    <div className="flex items-center justify-between gap-4 p-3">
      <Text htmlFor={htmlFor} className={cn("flex min-w-0 flex-col", htmlFor && "cursor-pointer")}>
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </Text>
      {children}
    </div>
  );
}

type Props = {
  me: User | null;
  onProfileChange: (me: User) => void;
  onAccountDeleted: () => void;
};

export function SettingsDialog({ me, onProfileChange, onAccountDeleted }: Props) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const followsSystem = theme === "system";

  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="ghost" className="w-full justify-start gap-2 px-2" />}
      >
        {/* The gear turns a bit on hover. */}
        <RiSettings3Line className="text-primary transition-transform duration-500 group-hover/button:rotate-90 motion-reduce:transition-none" />
        Configurações
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>Personalize o Roomly e gerencie sua conta.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {me && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <UserAvatar name={me.name} src={me.avatar_url} size="lg" />
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{me.name}</span>
                <span className="truncate text-sm text-muted-foreground">{me.email}</span>
              </div>
            </div>
          )}

          {me && (
            <Group id="profile-title" title="Perfil">
              <Row title="Foto de perfil" description="JPG, PNG ou WebP (com ajuste), ou GIF até 10 MB.">
                <ProfilePhoto me={me} onChange={onProfileChange} />
              </Row>
            </Group>
          )}

          <Group id="appearance-title" title="Aparência">
            <Row
              title="Tema escuro"
              description={resolvedTheme === "dark" ? "Ativado" : "Desativado"}
              htmlFor="theme-switch"
            >
              <ThemeSwitch id="theme-switch" />
            </Row>
            <Row
              title="Seguir o sistema"
              description={
                followsSystem
                  ? "O tema muda junto com o do seu dispositivo."
                  : "Você escolheu um tema fixo neste navegador."
              }
            >
              <Button
                variant="outline"
                size="sm"
                disabled={followsSystem}
                onClick={() => setTheme("system")}
              >
                {followsSystem ? "Ativo" : "Usar"}
              </Button>
            </Row>
          </Group>

          <Group id="danger-title" title="Zona de perigo" danger>
            <Row
              title="Excluir conta"
              description="Apaga sua conta, mensagens e amizades para sempre."
            >
              <DeleteAccountDialog onDeleted={onAccountDeleted} />
            </Row>
          </Group>
        </div>
      </DialogContent>
    </Dialog>
  );
}
