"use client";

import { RiArrowLeftLine, RiChat3Line, RiWifiOffLine } from "@remixicon/react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ExitButton } from "@/components/exit-button";
import { useFriendsStore } from "@/features/friends";
import { SettingsDialog } from "@/features/settings";
import { UserAvatar } from "@/features/users";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth.store";

import { useChatSession } from "../hooks/use-chat-session";
import {
  conversationAvatar,
  conversationTitle,
  memberCountLabel,
  otherMemberIds,
} from "../lib/conversation";
import { useChatStore } from "../store/chat.store";
import { AddMembersDialog } from "./add-members-dialog";
import { CallAudio, CallBar, CallButton, CallStage } from "./call-panel";
import { ConversationList } from "./conversation-list";
import { ExploreGroupsDialog } from "./explore-groups-dialog";
import { FriendsDialog } from "./friends-dialog";
import { GroupMembersDialog } from "./group-members-dialog";
import { GroupPasswordDialog } from "./group-password-dialog";
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
  const selectedId = useChatStore((state) => state.selectedId);
  const selected = useChatStore(
    (state) => state.conversations.find((c) => c.id === state.selectedId) ?? null,
  );

  // An open conversation is a history entry, so the phone's back button/gesture
  // returns to the list instead of leaving the app.
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => select(event.state?.conversationId ?? null);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [select]);

  useEffect(() => {
    const inHistory = window.history.state?.conversationId ?? null;
    if (selectedId === null || selectedId === inHistory) return;

    // Keeps Next.js' own router state, which lives in history.state too.
    const state = { ...window.history.state, conversationId: selectedId };
    if (inHistory === null) window.history.pushState(state, "");
    else window.history.replaceState(state, "");
  }, [selectedId]);

  function closeConversation() {
    if (window.history.state?.conversationId) window.history.back();
    else select(null);
  }

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
        <header className="flex h-16 shrink-0 items-center gap-1 border-b px-3">
          {me && <UserAvatar name={me.name} src={me.avatar_url} />}
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

        <CallBar />

        <footer className="flex h-14 shrink-0 items-center border-t px-2">
          <SettingsDialog
            me={me}
            onProfileChange={useChatStore.getState().updateMe}
            onAccountDeleted={logout}
          />
        </footer>
      </aside>

      <main className={cn("min-w-0 flex-1 flex-col md:flex", selected ? "flex" : "hidden")}>
        {selected ? (
          // key: switching conversations replays the entrance animation.
          <div
            key={selected.id}
            className="flex min-h-0 flex-1 flex-col motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-right-4 md:motion-safe:slide-in-from-right-0"
          >
            <header className="flex h-16 shrink-0 items-center gap-3 border-b px-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Voltar"
                onClick={closeConversation}
              >
                <RiArrowLeftLine />
              </Button>
              {selected.is_group ? (
                <GroupMembersDialog conversation={selected} title={title}>
                  <UserAvatar name={title} group />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <h1 className="truncate text-sm font-medium">{title}</h1>
                    <span className="text-xs text-muted-foreground">
                      {memberCountLabel(selected.member_ids.length)} · {onlineOthers.length} online
                      · ver participantes
                    </span>
                  </div>
                </GroupMembersDialog>
              ) : (
                <>
                  <UserAvatar
                    name={title}
                    src={conversationAvatar(selected, me?.id, users)}
                    online={onlineOthers.length > 0}
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <h1 className="truncate text-sm font-medium">{title}</h1>
                    <span className="text-xs text-muted-foreground">
                      {onlineOthers.length ? "online" : "offline"}
                    </span>
                  </div>
                </>
              )}
              <CallButton conversationId={selected.id} />
              {selected.is_group && (
                <>
                  <AddMembersDialog groupName={title} />
                  {selected.owner_id === me?.id && (
                    <GroupPasswordDialog groupName={title} hasPassword={selected.has_password} />
                  )}
                  <LeaveGroupDialog groupName={title} isLastMember={others.length === 0} />
                </>
              )}
            </header>

            <CallStage conversationId={selected.id} />
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

      <CallAudio />
    </div>
  );
}
