"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { RiUserAddLine } from "@remixicon/react";
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

import {
  addMembersSchema,
  type AddMembersInput,
  type AddMembersValues,
} from "../schemas/conversation.schema";
import { useChatStore } from "../store/chat.store";

export function AddMembersDialog({ groupName }: { groupName: string }) {
  const addMembers = useChatStore((state) => state.addMembers);
  const [open, setOpen] = useState(false);

  const form = useForm<AddMembersInput, unknown, AddMembersValues>({
    resolver: zodResolver(addMembersSchema),
    defaultValues: { emails: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ emails }) => {
    if (await addMembers(emails)) {
      form.reset();
      setOpen(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="Adicionar pessoas" />}>
        <RiUserAddLine />
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Adicionar pessoas</DialogTitle>
            <DialogDescription>Convide mais gente para {groupName}.</DialogDescription>
          </DialogHeader>

          <TextField
            id="add-emails"
            label="E-mails"
            placeholder="bia@email.com, caio@email.com"
            autoFocus
            hint="Separe por vírgula. Quem já está no grupo é ignorado."
            error={errors.emails}
            registration={form.register("emails")}
          />

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adicionando…" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
