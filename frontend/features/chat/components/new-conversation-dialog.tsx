"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { RiChatNewLine, RiGroupLine, RiUserLine } from "@remixicon/react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  directSchema,
  groupSchema,
  type DirectValues,
  type GroupInput,
  type GroupValues,
} from "../schemas/conversation.schema";
import { useChatStore } from "../store/chat.store";

const panelClass =
  "flex flex-col gap-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1";

function DirectForm({ onDone }: { onDone: () => void }) {
  const openDirect = useChatStore((state) => state.openDirect);
  const form = useForm<DirectValues>({ resolver: zodResolver(directSchema) });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ email }) => {
    if (await openDirect(email)) onDone();
  });

  return (
    <form onSubmit={onSubmit} noValidate className={panelClass}>
      <TextField
        id="direct-email"
        label="E-mail da pessoa"
        type="email"
        placeholder="bia@email.com"
        autoFocus
        hint="Se vocês já conversam, a conversa existente é aberta."
        error={errors.email}
        registration={form.register("email")}
      />
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Abrindo…" : "Abrir conversa"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function GroupForm({ onDone }: { onDone: () => void }) {
  const createGroup = useChatStore((state) => state.createGroup);
  const form = useForm<GroupInput, unknown, GroupValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: "", emails: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ name, emails }) => {
    if (await createGroup(name, emails)) onDone();
  });

  return (
    <form onSubmit={onSubmit} noValidate className={panelClass}>
      <TextField
        id="group-name"
        label="Nome do grupo"
        placeholder="Fãs de café"
        maxLength={100}
        error={errors.name}
        registration={form.register("name")}
      />
      <TextField
        id="group-emails"
        label="Convidar (opcional)"
        placeholder="bia@email.com, caio@email.com"
        hint="Grupos são públicos: qualquer pessoa pode encontrar e entrar."
        error={errors.emails}
        registration={form.register("emails")}
      />
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Criando…" : "Criar grupo"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function NewConversationDialog() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="Nova conversa" />}>
        <RiChatNewLine />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova conversa</DialogTitle>
          <DialogDescription>Fale com alguém ou crie um grupo.</DialogDescription>
        </DialogHeader>

        {/* Each tab is its own form, so switching tabs never mixes their fields. */}
        <Tabs defaultValue="direct">
          <TabsList className="w-full">
            <TabsTrigger value="direct">
              <RiUserLine /> Conversa
            </TabsTrigger>
            <TabsTrigger value="group">
              <RiGroupLine /> Grupo
            </TabsTrigger>
          </TabsList>
          <TabsContent value="direct" className="pt-2">
            <DirectForm onDone={close} />
          </TabsContent>
          <TabsContent value="group" className="pt-2">
            <GroupForm onDone={close} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
