"use client";

import { RiErrorWarningLine } from "@remixicon/react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteMe } from "@/features/users";

export function DeleteAccountDialog({ onDeleted }: { onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteMe();
      toast.success("Sua conta foi excluída.");
      onDeleted();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Algo deu errado.");
      setDeleting(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" size="sm" className="shrink-0" />}>
        Excluir conta
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir sua conta?</DialogTitle>
          <DialogDescription>Não dá para desfazer.</DialogDescription>
        </DialogHeader>

        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          <RiErrorWarningLine className="mt-0.5 size-4 shrink-0" />
          Suas mensagens, amizades e participação em grupos serão apagadas para sempre, inclusive
          nas conversas com outras pessoas.
        </p>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Excluindo…" : "Excluir para sempre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
