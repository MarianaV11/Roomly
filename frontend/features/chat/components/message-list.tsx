"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { formatMessageTime } from "@/lib/date";
import { cn } from "@/lib/utils";

import { EMPTY_THREAD, useChatStore } from "../store/chat.store";

export function MessageList({ showSenderNames }: { showSenderNames: boolean }) {
  const thread = useChatStore((state) =>
    state.selectedId !== null ? (state.threads[state.selectedId] ?? EMPTY_THREAD) : EMPTY_THREAD,
  );
  const meId = useChatStore((state) => state.me?.id);
  const users = useChatStore((state) => state.users);
  const loadOlder = useChatStore((state) => state.loadOlder);

  const bottomRef = useRef<HTMLDivElement>(null);
  const lastId = thread.items.at(-1)?.id;

  // Follow new messages at the bottom; loading older ones (top) doesn't move the view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lastId]);

  return (
    <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
      {thread.hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="self-center"
          onClick={loadOlder}
          disabled={thread.loading}
        >
          {thread.loading ? "Carregando…" : "Carregar mensagens anteriores"}
        </Button>
      )}

      {!thread.loading && thread.items.length === 0 && (
        <p className="m-auto text-sm text-muted-foreground motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:fade-in">
          Nenhuma mensagem. Diga oi!
        </p>
      )}

      {thread.items.map((message, index) => {
        const mine = message.sender_id === meId;
        const firstOfRun = thread.items[index - 1]?.sender_id !== message.sender_id;

        return (
          <div
            key={message.id}
            className={cn(
              "flex max-w-[80%] flex-col motion-safe:animate-in motion-safe:duration-200 motion-safe:fade-in",
              // Mine come in from the right, theirs from the left.
              mine
                ? "items-end self-end motion-safe:slide-in-from-right-4"
                : "self-start motion-safe:slide-in-from-left-4",
              firstOfRun && "mt-2",
            )}
          >
            {showSenderNames && !mine && firstOfRun && (
              <span className="mb-0.5 px-1 text-xs text-muted-foreground">
                {users[message.sender_id]?.name ?? "…"}
              </span>
            )}
            <div
              className={cn(
                "rounded-2xl px-3 py-1.5 text-sm break-words whitespace-pre-wrap",
                mine ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {message.content}
            </div>
            <time
              className="px-1 text-[0.7rem] text-muted-foreground"
              dateTime={message.created_at}
            >
              {formatMessageTime(message.created_at)}
            </time>
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
