"use client";

import { useEffect, useMemo } from "react";

import { listActiveCalls, setCallSender, useCallStore } from "@/features/call";
import { useFriendsStore } from "@/features/friends";
import { getMe } from "@/features/users";

import { announceCall } from "../lib/call";
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
  const friendships = useFriendsStore((state) => state.items);

  // ---- initial load (fresh store per login) --------------------------------
  useEffect(() => {
    const store = useChatStore.getState();
    let cancelled = false;

    store.reset();
    useFriendsStore.getState().reset();
    useFriendsStore.getState().load();
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

  // ---- presence: new contacts (conversations or friends) → ask who is online
  const contactKey = useMemo(() => {
    const ids = new Set(conversations.flatMap((c) => c.member_ids));
    for (const f of friendships) if (f.status === "accepted") ids.add(f.user.id);
    if (meId !== undefined) ids.delete(meId);
    return [...ids].sort((a, b) => a - b).join(",");
  }, [conversations, friendships, meId]);

  useEffect(() => {
    if (!contactKey) return;
    onlineAmong(contactKey).then(useChatStore.getState().setOnline, showError);
  }, [contactKey]);

  // ---- real time ------------------------------------------------------------
  const send = useChatSocket(token, {
    onEvent(event) {
      const store = useChatStore.getState();

      if (event.type === "message") store.receiveMessage(event.data);
      if (event.type === "conversation") store.upsertConversation(event.data);
      if (event.type === "conversation_removed") store.removeConversation(event.data.id);
      if (event.type === "presence") store.setPresence(event.data.user_id, event.data.online);
      if (event.type === "friends_changed") useFriendsStore.getState().load();

      const call = useCallStore.getState();
      if (event.type === "call_state") {
        announceCall(event.data);
        call.applyState(event.data);
      }
      if (event.type === "call_signal") {
        call.handleSignal(event.data.conversation_id, event.data.from, event.data.payload);
      }
      if (event.type === "call_ended") {
        call.end(event.data.conversation_id, "A chamada continuou em outra aba.");
      }
      if (event.type === "conversation_removed") call.end(event.data.id);
      if (event.type === "error") {
        if (call.joining) call.joinFailed(event.data.detail);
        else showError(new Error(event.data.detail));
      }
    },
    onOpen(reconnected) {
      const store = useChatStore.getState();

      store.setConnected(true);
      onlineAmong(contactKey).then(store.setOnline, showError);
      listActiveCalls().then(useCallStore.getState().setActive, showError);

      // While disconnected we missed events: reload everything that was on screen.
      if (reconnected) {
        listConversations().then(store.setConversations, showError);
        useFriendsStore.getState().load();
        store.clearThreads();
        if (store.selectedId !== null) store.loadThread(store.selectedId);
      }
    },
    onClose() {
      useChatStore.getState().setConnected(false);
      useCallStore.getState().disconnected();
    },
  });

  useEffect(() => {
    setCallSender(send);
    return () => {
      useCallStore.getState().leave();
      setCallSender(() => {});
    };
  }, [send]);
}
