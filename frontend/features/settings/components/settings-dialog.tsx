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

import { ThemeSwitch } from "./theme-switch";

export function SettingsDialog() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const followsSystem = theme === "system";

  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="ghost" className="w-full justify-start gap-2 px-2" />}
      >
        {/* The gear turns a bit on hover. */}
        <RiSettings3Line className="transition-transform duration-500 group-hover/button:rotate-90 motion-reduce:transition-none" />
        Configurações
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>Personalize o Roomly neste navegador.</DialogDescription>
        </DialogHeader>

        <section aria-labelledby="appearance-title" className="flex flex-col gap-3">
          <h3 id="appearance-title" className="text-xs font-medium text-muted-foreground uppercase">
            Aparência
          </h3>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <label htmlFor="theme-switch" className="flex cursor-pointer flex-col">
              <span className="text-sm font-medium">Tema</span>
              <span className="text-xs text-muted-foreground">
                {resolvedTheme === "dark" ? "Escuro" : "Claro"}
                {followsSystem && " · seguindo o sistema"}
              </span>
            </label>
            <ThemeSwitch id="theme-switch" />
          </div>

          {!followsSystem && (
            <Button
              variant="link"
              size="sm"
              className="self-start px-0 motion-safe:animate-in motion-safe:fade-in"
              onClick={() => setTheme("system")}
            >
              Voltar a seguir o tema do sistema
            </Button>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}
