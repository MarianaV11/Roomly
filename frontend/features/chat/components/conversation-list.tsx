"use client";

import { UserAvatar } from "@/features/users";
import { cn } from "@/lib/utils";

import { conversationTitle, memberCountLabel, otherMemberIds } from "../lib/conversation";
import { useChatStore } from "../store/chat.store";

export function ConversationList() {
  const conversations = useChatStore((state) => state.conversations);
  const selectedId = useChatStore((state) => state.selectedId);
  const meId = useChatStore((state) => state.me?.id);
  const users = useChatStore((state) => state.users);
  const online = useChatStore((state) => state.online);
  const unread = useChatStore((state) => state.unread);
  const select = useChatStore((state) => state.select);

  if (conversations.length === 0) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        Nenhuma conversa ainda. Comece uma nova ou explore os grupos públicos pelos botões acima.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5 p-2">
      {conversations.map((conversation) => {
        const others = otherMemberIds(conversation, meId);
        const title = conversationTitle(conversation, meId, users);
        const onlineCount = others.filter((id) => online.has(id)).length;
        const isUnread = unread.has(conversation.id);
        const isSelected = conversation.id === selectedId;

        return (
          // New conversations slide in; the key keeps existing rows from re-animating.
          <li
            key={conversation.id}
            className="motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-left-2"
          >
            <button
              type="button"
              onClick={() => select(conversation.id)}
              aria-current={isSelected ? "true" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-all duration-200 hover:bg-muted active:scale-[0.98]",
                isSelected && "bg-muted",
              )}
            >
              <UserAvatar
                name={title}
                online={!conversation.is_group && onlineCount > 0}
                group={conversation.is_group}
              />

              <span className="flex min-w-0 flex-1 flex-col">
                <span className={cn("truncate text-sm", isUnread && "font-semibold")}>{title}</span>
                {conversation.is_group && (
                  <span className="truncate text-xs text-muted-foreground">
                    {memberCountLabel(conversation.member_ids.length)} · {onlineCount} online
                  </span>
                )}
              </span>

              {isUnread && (
                <span
                  className="size-2 shrink-0 rounded-full bg-primary motion-safe:animate-in motion-safe:zoom-in"
                  aria-label="não lida"
                />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
