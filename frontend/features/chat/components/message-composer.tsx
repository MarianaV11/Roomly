"use client";

import { RiSendPlane2Line } from "@remixicon/react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useChatStore } from "../store/chat.store";
import { EmojiButton } from "./emoji-button";

export function MessageComposer() {
  const send = useChatStore((state) => state.send);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Inserts where the caret was (the input keeps its selection while the picker has focus).
  function insertEmoji(emoji: string) {
    const input = inputRef.current;
    const start = input?.selectionStart ?? content.length;
    const end = input?.selectionEnd ?? content.length;
    if (content.length - (end - start) + emoji.length > 4000) return;

    setContent(content.slice(0, start) + emoji + content.slice(end));
    requestAnimationFrame(() =>
      input?.setSelectionRange(start + emoji.length, start + emoji.length),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = content.trim();
    if (!text || sending) return;

    setSending(true);
    if (await send(text)) setContent(""); // keep the text if sending failed
    setSending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-14 shrink-0 items-center gap-2 border-t px-3">
      <EmojiButton onPick={insertEmoji} />
      <Input
        ref={inputRef}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Escreva uma mensagem"
        aria-label="Mensagem"
        maxLength={4000}
        autoComplete="off"
        autoFocus
      />
      <Button type="submit" size="icon" disabled={sending || !content.trim()} aria-label="Enviar">
        <RiSendPlane2Line />
      </Button>
    </form>
  );
}
