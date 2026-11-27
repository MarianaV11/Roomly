"use client";

import {
  RiCheckLine,
  RiLockLine,
  RiTimeLine,
  RiUserAddLine,
  RiVipCrownLine,
} from "@remixicon/react";
import { useState } from "react";

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
import { UserAvatar, type User } from "@/features/users";

import { memberCountLabel } from "../lib/conversation";
import { useChatStore } from "../store/chat.store";
import type { Conversation } from "../types/chat";

function FriendAction({ user, friendship }: { user: User; friendship?: Friendship }) {
  const send = useFriendsStore((state) => state.send);
  const accept = useFriendsStore((state) => state.accept);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<boolean>) {
    setBusy(true);
    await action();
    setBusy(false);
  }

  if (friendship?.status === "accepted") {
    return (
      <span className="flex shrink-0 items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
        <RiCheckLine className="size-3.5" aria-hidden /> Amigos
      </span>
    );
  }

  if (friendship?.direction === "outgoing") {
    return (
      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
        <RiTimeLine className="size-3.5" aria-hidden /> Pedido enviado
      </span>
    );
  }

  if (friendship?.direction === "incoming") {
    return (
      <Button size="sm" disabled={busy} onClick={() => run(() => accept(friendship.id))}>
        <RiCheckLine /> {busy ? "Aceitando…" : "Aceitar pedido"}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={busy}
      onClick={() => run(() => send(user.email))}
      aria-label={`Adicionar ${user.name} como amigo`}
    >
      <RiUserAddLine /> {busy ? "Enviando…" : "Adicionar"}
    </Button>
  );
}

type Props = {
  conversation: Conversation;
  title: string;
  /** The header's avatar and name, which become the button that opens the dialog. */
  children: React.ReactNode;
};

export function GroupMembersDialog({ conversation, title, children }: Props) {
  const meId = useChatStore((state) => state.me?.id);
  const users = useChatStore((state) => state.users);
  const online = useChatStore((state) => state.online);
  const friendships = useFriendsStore((state) => state.items);

  const friendshipWith = (userId: number) => friendships.find((f) => f.user.id === userId);

  // Owner first, then you, then everyone else by name.
  const rank = (id: number) => (id === conversation.owner_id ? 0 : id === meId ? 1 : 2);
  const members = [...conversation.member_ids].sort(
    (a, b) =>
      rank(a) - rank(b) || (users[a]?.name ?? "").localeCompare(users[b]?.name ?? "", "pt-BR"),
  );
  const onlineCount = members.filter((id) => id !== meId && online.has(id)).length;

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="-my-1 flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 pr-2 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={`Ver participantes de ${title}`}
          />
        }
      >
        {children}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            {title}
            {conversation.has_password && (
              <RiLockLine className="size-4 text-muted-foreground" aria-label="Grupo com senha" />
            )}
          </DialogTitle>
          <DialogDescription>
            {memberCountLabel(members.length)} · {onlineCount} online
          </DialogDescription>
        </DialogHeader>

        <ul className="-mx-1 flex max-h-96 flex-col gap-0.5 overflow-y-auto px-1">
          {members.map((id, index) => {
            const user = users[id];
            const isMe = id === meId;

            return (
              <li
                key={id}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60 motion-safe:animate-in motion-safe:fill-mode-backwards motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
                style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
              >
                <UserAvatar
                  name={user?.name ?? "…"}
                  src={user?.avatar_url}
                  online={!isMe && online.has(id)}
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-1.5 truncate text-sm">
                    {user?.name ?? "…"}
                    {isMe && <span className="text-muted-foreground">(você)</span>}
                  </span>
                  {id === conversation.owner_id && (
                    <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <RiVipCrownLine className="size-3" aria-hidden /> Dono do grupo
                    </span>
                  )}
                </span>
                {!isMe && user && <FriendAction user={user} friendship={friendshipWith(id)} />}
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
