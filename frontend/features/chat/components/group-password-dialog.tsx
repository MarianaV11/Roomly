"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { RiLockLine, RiLockUnlockLine } from "@remixicon/react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { groupPasswordSchema, type GroupPasswordValues } from "../schemas/conversation.schema";
import { useChatStore } from "../store/chat.store";

type Props = { groupName: string; hasPassword: boolean };

export function GroupPasswordDialog({ groupName, hasPassword }: Props) {
  const setGroupPassword = useChatStore((state) => state.setGroupPassword);
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const form = useForm<GroupPasswordValues>({
    resolver: zodResolver(groupPasswordSchema),
    defaultValues: { password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function save(password: string | null) {
    if (await setGroupPassword(password)) {
      form.reset();
      setOpen(false);
    }
  }

  const onSubmit = form.handleSubmit(({ password }) => save(password));

  async function handleRemove() {
    setRemoving(true);
    await save(null);
    setRemoving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={hasPassword ? "Senha do grupo (ativa)" : "Colocar senha no grupo"}
          />
        }
      >
        {hasPassword ? <RiLockLine /> : <RiLockUnlockLine />}
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Senha de {groupName}</DialogTitle>
            <DialogDescription>
              {hasPassword
                ? "Quem quiser entrar precisa da senha. Quem já está no grupo continua nele."
                : "Com senha, só entra quem souber. Quem já está no grupo continua nele."}
            </DialogDescription>
          </DialogHeader>

          <TextField
            id="group-password"
            label={hasPassword ? "Nova senha" : "Senha"}
            type="password"
            autoComplete="new-password"
            autoFocus
            error={errors.password}
            registration={form.register("password")}
          />

          <DialogFooter>
            {hasPassword && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemove}
                disabled={isSubmitting || removing}
              >
                {removing ? "Removendo…" : "Remover senha"}
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || removing}>
              {isSubmitting ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
