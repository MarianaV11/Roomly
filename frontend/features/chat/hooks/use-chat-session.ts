"use client";

import { useEffect, useMemo } from "react";

import { getMe } from "@/features/users";

import { listConversations, listOnline } from "../services/chat.service";
import { showError, useChatStore } from "../store/chat.store";
import { useChatSocket } from "./use-chat-socket";

/** `contactKey` is "1,4,9": a string so effects can depend on it by value. */
const onlineAmong = (contactKey: string) =>
  listOnline(contactKey ? contactKey.split(",").map(Number) : []);

/**
 * Drives the chat while the screen is open: initial load, member names, presence and
 * the WebSocket. All state lives in useChatStore; this hook only feeds it.
 */
export function useChatSession(token: string) {
  const conversations = useChatStore((state) => state.conversations);
  const meId = useChatStore((state) => state.me?.id);

  // ---- initial load (fresh store per login) --------------------------------
  useEffect(() => {
    const store = useChatStore.getState();
    let cancelled = false;

    store.reset();
    Promise.all([getMe(), listConversations()])
      .then(([me, conversations]) => !cancelled && store.start(me, conversations))
      .catch(showError);

    return () => {
      cancelled = true;
    };
  }, [token]);

  // ---- names of everyone who appears in a conversation ---------------------
  useEffect(() => {
    useChatStore.getState().fetchMissingUsers();
  }, [conversations]);

  // ---- presence: new contacts → ask who is online --------------------------
  const contactKey = useMemo(() => {
    const ids = new Set(conversations.flatMap((c) => c.member_ids));
    if (meId !== undefined) ids.delete(meId);
    return [...ids].sort((a, b) => a - b).join(",");
  }, [conversations, meId]);

  useEffect(() => {
    if (!contactKey) return;
    onlineAmong(contactKey).then(useChatStore.getState().setOnline, showError);
  }, [contactKey]);

  // ---- real time ------------------------------------------------------------
  useChatSocket(token, {
    onEvent(event) {
      const store = useChatStore.getState();

      if (event.type === "message") store.receiveMessage(event.data);
      if (event.type === "conversation") store.upsertConversation(event.data);
      if (event.type === "conversation_removed") store.removeConversation(event.data.id);
      if (event.type === "presence") store.setPresence(event.data.user_id, event.data.online);
    },
    onOpen(reconnected) {
      const store = useChatStore.getState();

      store.setConnected(true);
      onlineAmong(contactKey).then(store.setOnline, showError);

      // While disconnected we missed events: reload everything that was on screen.
      if (reconnected) {
        listConversations().then(store.setConversations, showError);
        store.clearThreads();
        if (store.selectedId !== null) store.loadThread(store.selectedId);
      }
    },
    onClose() {
      useChatStore.getState().setConnected(false);
    },
  });
}
