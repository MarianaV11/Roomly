"use client";

import { RiArrowLeftLine, RiChat3Line, RiWifiOffLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { ExitButton } from "@/components/exit-button";
import { useFriendsStore } from "@/features/friends";
import { SettingsDialog } from "@/features/settings";
import { UserAvatar } from "@/features/users";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth.store";

import { useChatSession } from "../hooks/use-chat-session";
import { conversationTitle, memberCountLabel, otherMemberIds } from "../lib/conversation";
import { useChatStore } from "../store/chat.store";
import { AddMembersDialog } from "./add-members-dialog";
import { ConversationList } from "./conversation-list";
import { ExploreGroupsDialog } from "./explore-groups-dialog";
import { FriendsDialog } from "./friends-dialog";
import { LeaveGroupDialog } from "./leave-group-dialog";
import { MessageComposer } from "./message-composer";
import { MessageList } from "./message-list";
import { NewConversationDialog } from "./new-conversation-dialog";

export function ChatView({ token }: { token: string }) {
  useChatSession(token);

  const me = useChatStore((state) => state.me);
  const users = useChatStore((state) => state.users);
  const online = useChatStore((state) => state.online);
  const connected = useChatStore((state) => state.connected);
  const select = useChatStore((state) => state.select);
  const selected = useChatStore(
    (state) => state.conversations.find((c) => c.id === state.selectedId) ?? null,
  );

  function logout() {
    useChatStore.getState().reset();
    useFriendsStore.getState().reset();
    useAuth.getState().clearAuth();
  }

  const others = selected ? otherMemberIds(selected, me?.id) : [];
  const onlineOthers = others.filter((id) => online.has(id));
  const title = selected ? conversationTitle(selected, me?.id, users) : "";

  return (
    <div className="flex h-dvh motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in">
      {/* On phones only one pane is visible: the list, or the open conversation. */}
      <aside
        className={cn("w-full flex-col border-r md:flex md:w-80", selected ? "hidden" : "flex")}
      >
        <header className="flex items-center gap-1 border-b p-3">
          {me && <UserAvatar name={me.name} />}
          <div className="ml-1 flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{me?.name ?? "…"}</span>
            {!connected && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground motion-safe:animate-pulse">
                <RiWifiOffLine className="size-3" /> reconectando…
              </span>
            )}
          </div>
          <FriendsDialog />
          <ExploreGroupsDialog />
          <NewConversationDialog />
          <div className="ml-1">
            <ExitButton label="Sair" onClick={logout} />
          </div>
        </header>

        <nav className="flex-1 overflow-y-auto" aria-label="Conversas">
          <ConversationList />
        </nav>

        <footer className="border-t p-2">
          <SettingsDialog me={me} onAccountDeleted={logout} />
        </footer>
      </aside>

      <main className={cn("min-w-0 flex-1 flex-col md:flex", selected ? "flex" : "hidden")}>
        {selected ? (
          // key: switching conversations replays the entrance animation.
          <div
            key={selected.id}
            className="flex min-h-0 flex-1 flex-col motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-right-4 md:motion-safe:slide-in-from-right-0"
          >
            <header className="flex items-center gap-3 border-b p-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Voltar"
                onClick={() => select(null)}
              >
                <RiArrowLeftLine />
              </Button>
              <UserAvatar
                name={title}
                group={selected.is_group}
                online={!selected.is_group && onlineOthers.length > 0}
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <h1 className="truncate text-sm font-medium">{title}</h1>
                <span className="text-xs text-muted-foreground">
                  {selected.is_group
                    ? `${memberCountLabel(selected.member_ids.length)} · ${onlineOthers.length} online`
                    : onlineOthers.length
                      ? "online"
                      : "offline"}
                </span>
              </div>
              {selected.is_group && (
                <>
                  <AddMembersDialog groupName={title} />
                  <LeaveGroupDialog groupName={title} isLastMember={others.length === 0} />
                </>
              )}
            </header>

            <MessageList showSenderNames={selected.is_group} />
            <MessageComposer />
          </div>
        ) : (
          <div className="m-auto flex flex-col items-center gap-2 text-muted-foreground motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:fade-in">
            <RiChat3Line className="size-8" />
            <p className="text-sm">Escolha uma conversa, comece uma nova ou explore os grupos.</p>
          </div>
        )}
      </main>
    </div>
  );
}
