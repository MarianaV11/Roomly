"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  RiChat3Line,
  RiCheckLine,
  RiCloseLine,
  RiPhoneLine,
  RiUserAddLine,
  RiUserHeartLine,
  RiUserUnfollowLine,
} from "@remixicon/react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFriendsStore, type Friendship } from "@/features/friends";
import { UserAvatar } from "@/features/users";

import { joinCall } from "../lib/call";
import { directSchema, type DirectValues } from "../schemas/conversation.schema";
import { useChatStore } from "../store/chat.store";

function AddFriendForm() {
  const send = useFriendsStore((state) => state.send);
  const form = useForm<DirectValues>({ resolver: zodResolver(directSchema) });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ email }) => {
    if (await send(email)) form.reset({ email: "" });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex items-start gap-2">
      <div className="flex-1">
        <TextField
          id="friend-email"
          label="Adicionar amigo"
          type="email"
          placeholder="bia@email.com"
          error={errors.email}
          registration={form.register("email")}
        />
      </div>
      <Button type="submit" className="mt-7" disabled={isSubmitting}>
        <RiUserAddLine /> {isSubmitting ? "Enviando…" : "Enviar"}
      </Button>
    </form>
  );
}

function Section({
  title,
  items,
  actions,
}: {
  title: string;
  items: Friendship[];
  actions: (friendship: Friendship) => React.ReactNode;
}) {
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title} · {items.length}
      </h3>
      <ul className="flex flex-col gap-0.5">
        {items.map((friendship) => (
          <li
            key={friendship.id}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 motion-safe:animate-in motion-safe:fade-in"
          >
            <UserAvatar name={friendship.user.name} src={friendship.user.avatar_url} size="sm" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm">{friendship.user.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {friendship.user.email}
              </span>
            </span>
            {actions(friendship)}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FriendsDialog() {
  const items = useFriendsStore((state) => state.items);
  const accept = useFriendsStore((state) => state.accept);
  const remove = useFriendsStore((state) => state.remove);
  const online = useChatStore((state) => state.online);
  const openDirect = useChatStore((state) => state.openDirect);

  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const incoming = items.filter((f) => f.status === "pending" && f.direction === "incoming");
  const outgoing = items.filter((f) => f.status === "pending" && f.direction === "outgoing");
  const friends = items.filter((f) => f.status === "accepted");

  async function run(id: number, action: () => Promise<unknown>) {
    setBusyId(id);
    await action();
    setBusyId(null);
  }

  async function chatWith(friendship: Friendship, call = false) {
    setBusyId(friendship.id);
    if (await openDirect(friendship.user.email)) {
      setOpen(false);
      const conversationId = useChatStore.getState().selectedId;
      if (call && conversationId !== null) await joinCall(conversationId);
    }
    setBusyId(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon" className="relative" aria-label="Amigos" />}
      >
        <RiUserHeartLine />
        {incoming.length > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground motion-safe:animate-in motion-safe:zoom-in"
            aria-label={`${incoming.length} pedidos de amizade`}
          >
            {incoming.length > 9 ? "9+" : incoming.length}
          </span>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Amigos</DialogTitle>
          <DialogDescription>
            Envie pedidos pelo e-mail e converse com seus amigos.
          </DialogDescription>
        </DialogHeader>

        <AddFriendForm />

        <div className="-mx-2 flex max-h-[50vh] flex-col gap-4 overflow-y-auto">
          <Section
            title="Pedidos recebidos"
            items={incoming}
            actions={(f) => (
              <>
                <Button
                  size="icon-sm"
                  aria-label={`Aceitar ${f.user.name}`}
                  disabled={busyId === f.id}
                  onClick={() => run(f.id, () => accept(f.id))}
                >
                  <RiCheckLine />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Recusar ${f.user.name}`}
                  disabled={busyId === f.id}
                  onClick={() => run(f.id, () => remove(f.id))}
                >
                  <RiCloseLine />
                </Button>
              </>
            )}
          />

          <Section
            title="Amigos"
            items={friends}
            actions={(f) => (
              <>
                {online.has(f.user.id) && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">online</span>
                )}
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Ligar para ${f.user.name}`}
                  disabled={busyId === f.id}
                  onClick={() => chatWith(f, true)}
                >
                  <RiPhoneLine />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Conversar com ${f.user.name}`}
                  disabled={busyId === f.id}
                  onClick={() => chatWith(f)}
                >
                  <RiChat3Line />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Desfazer amizade com ${f.user.name}`}
                  disabled={busyId === f.id}
                  onClick={() => run(f.id, () => remove(f.id))}
                >
                  <RiUserUnfollowLine />
                </Button>
              </>
            )}
          />

          <Section
            title="Pedidos enviados"
            items={outgoing}
            actions={(f) => (
              <Button
                size="sm"
                variant="ghost"
                disabled={busyId === f.id}
                onClick={() => run(f.id, () => remove(f.id))}
              >
                Cancelar
              </Button>
            )}
          />

          {items.length === 0 && (
            <p className="px-2 text-sm text-muted-foreground">
              Você ainda não tem amigos por aqui. Envie um pedido pelo e-mail acima.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
