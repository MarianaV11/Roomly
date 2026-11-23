"use client";

import { RiErrorWarningLine } from "@remixicon/react";
import { useState } from "react";

import { ExitButton } from "@/components/exit-button";
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

import { useChatStore } from "../store/chat.store";

type Props = {
  groupName: string;
  /** Leaving as the last member deletes the group, so the dialog says so. */
  isLastMember: boolean;
};

export function LeaveGroupDialog({ groupName, isLastMember }: Props) {
  const leaveGroup = useChatStore((state) => state.leaveGroup);
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  async function handleLeave() {
    setLeaving(true);
    // On success the conversation disappears and this dialog unmounts with it.
    if (!(await leaveGroup())) setLeaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Base UI renders the trigger *as* the ExitButton, adding its click/aria props. */}
      <DialogTrigger render={<ExitButton label="Sair do grupo" />} />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sair de {groupName}?</DialogTitle>
          <DialogDescription>
            Você deixa de receber as mensagens. Como o grupo é público, dá para entrar de novo
            depois.
          </DialogDescription>
        </DialogHeader>

        {isLastMember && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:fade-in"
          >
            <RiErrorWarningLine className="mt-0.5 size-4 shrink-0" />
            Você é o último membro: o grupo e todas as mensagens serão apagados para sempre.
          </p>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button variant="destructive" onClick={handleLeave} disabled={leaving}>
            {leaving ? "Saindo…" : isLastMember ? "Sair e apagar o grupo" : "Sair do grupo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
