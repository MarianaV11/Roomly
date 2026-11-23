"use client";

import { useEffect, useEffectEvent } from "react";

import { WS_BASE_URL } from "@/services/env.service";

import type { ChatEvent } from "../types/chat";

const RETRY_MS = 2000;

type Handlers = {
  onEvent: (event: ChatEvent) => void;
  /** Called on every (re)connection; `reconnected` is false only the first time. */
  onOpen: (reconnected: boolean) => void;
  onClose: () => void;
};

/** Keeps one WebSocket open while mounted, reconnecting if it drops. */
export function useChatSocket(token: string, handlers: Handlers) {
  const onEvent = useEffectEvent(handlers.onEvent);
  const onOpen = useEffectEvent(handlers.onOpen);
  const onClose = useEffectEvent(handlers.onClose);

  useEffect(() => {
    let socket: WebSocket;
    let retry: ReturnType<typeof setTimeout>;
    let disposed = false;
    let opens = 0;

    const connect = () => {
      socket = new WebSocket(`${WS_BASE_URL}/api/chat/ws?token=${encodeURIComponent(token)}`);

      socket.onopen = () => onOpen(opens++ > 0);
      socket.onmessage = (message) => onEvent(JSON.parse(message.data) as ChatEvent);
      socket.onclose = () => {
        onClose();
        if (!disposed) retry = setTimeout(connect, RETRY_MS);
      };
    };

    connect();

    return () => {
      disposed = true;
      clearTimeout(retry);
      socket.close();
    };
  }, [token]);
}
