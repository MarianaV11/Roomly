import { toast } from "sonner";
import { create } from "zustand";

import { findUserByEmail, getUser, type User } from "@/features/users";

import * as chatService from "../services/chat.service";
import type { Conversation, Message, Thread } from "../types/chat";

export const EMPTY_THREAD: Thread = { items: [], hasMore: false, loading: false };

/** Merges message lists, dropping duplicates (a sent message arrives via POST *and* WebSocket). */
function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.id - b.id);
}

export function showError(error: unknown) {
  toast.error(error instanceof Error ? error.message : "Algo deu errado.");
}

type ChatState = {
  me: User | null;
  conversations: Conversation[];
  users: Record<number, User>;
  threads: Record<number, Thread>;
  online: Set<number>;
  unread: Set<number>;
  selectedId: number | null;
  connected: boolean;

  reset: () => void;
  start: (me: User, conversations: Conversation[]) => void;
  setConnected: (connected: boolean) => void;
  setConversations: (conversations: Conversation[]) => void;
  upsertConversation: (conversation: Conversation) => void;
  removeConversation: (conversationId: number) => void;
  receiveMessage: (message: Message) => void;
  setOnline: (userIds: number[]) => void;
  setPresence: (userId: number, online: boolean) => void;
  clearThreads: () => void;

  fetchMissingUsers: () => Promise<void>;
  loadThread: (conversationId: number, beforeId?: number) => Promise<void>;
  loadOlder: () => void;
  select: (conversationId: number | null) => void;
  send: (content: string) => Promise<boolean>;
  openDirect: (email: string) => Promise<boolean>;
  createGroup: (name: string, emails: string[]) => Promise<boolean>;
  joinGroup: (conversationId: number) => Promise<boolean>;
  addMembers: (emails: string[]) => Promise<boolean>;
  leaveGroup: () => Promise<boolean>;
};

const initialState = {
  me: null,
  conversations: [],
  users: {},
  threads: {},
  online: new Set<number>(),
  unread: new Set<number>(),
  selectedId: null,
  connected: false,
};

// User ids already requested, so each name is fetched once.
const requestedUsers = new Set<number>();

export const useChatStore = create<ChatState>()((set, get) => ({
  ...initialState,

  // Called on logout/login: the next user must not see the previous user's data.
  reset: () => {
    requestedUsers.clear();
    set({ ...initialState, online: new Set(), unread: new Set() });
  },

  start: (me, conversations) =>
    set((state) => ({ me, conversations, users: { ...state.users, [me.id]: me } })),

  setConnected: (connected) => set({ connected }),

  setConversations: (conversations) => set({ conversations }),

  // New conversation → on top. Known one (someone joined/was added) → replaced in place.
  upsertConversation: (conversation) =>
    set((state) => ({
      conversations: state.conversations.some((c) => c.id === conversation.id)
        ? state.conversations.map((c) => (c.id === conversation.id ? conversation : c))
        : [conversation, ...state.conversations],
    })),

  // Forgets everything about it: the list entry, its messages and unread mark.
  removeConversation: (conversationId) =>
    set((state) => {
      const threads = { ...state.threads };
      delete threads[conversationId];
      const unread = new Set(state.unread);
      unread.delete(conversationId);

      return {
        conversations: state.conversations.filter((c) => c.id !== conversationId),
        threads,
        unread,
        selectedId: state.selectedId === conversationId ? null : state.selectedId,
      };
    }),

  receiveMessage: (message) =>
    set((state) => {
      const id = message.conversation_id;
      const thread = state.threads[id];
      const conversation = state.conversations.find((c) => c.id === id);
      const isUnread = id !== state.selectedId && message.sender_id !== state.me?.id;

      return {
        // Only threads already in memory get the message; others load fresh when opened.
        threads: thread
          ? { ...state.threads, [id]: { ...thread, items: mergeMessages(thread.items, [message]) } }
          : state.threads,
        // Most recent activity on top.
        conversations: conversation
          ? [conversation, ...state.conversations.filter((c) => c !== conversation)]
          : state.conversations,
        unread: isUnread ? new Set(state.unread).add(id) : state.unread,
      };
    }),

  setOnline: (userIds) => set({ online: new Set(userIds) }),

  setPresence: (userId, online) =>
    set((state) => {
      const next = new Set(state.online);
      if (online) next.add(userId);
      else next.delete(userId);
      return { online: next };
    }),

  clearThreads: () => set({ threads: {} }),

  fetchMissingUsers: async () => {
    const ids = new Set(get().conversations.flatMap((c) => c.member_ids));
    const missing = [...ids].filter((id) => !requestedUsers.has(id));
    if (missing.length === 0) return;

    missing.forEach((id) => requestedUsers.add(id));

    const found = await Promise.all(missing.map((id) => getUser(id).catch(() => null)));

    set((state) => {
      const users = { ...state.users };
      for (const user of found) if (user) users[user.id] = user;
      return { users };
    });
  },

  loadThread: async (conversationId, beforeId) => {
    const patch = (thread: Partial<Thread>) =>
      set((state) => ({
        threads: {
          ...state.threads,
          [conversationId]: { ...(state.threads[conversationId] ?? EMPTY_THREAD), ...thread },
        },
      }));

    patch({ loading: true });

    try {
      const page = await chatService.listMessages(conversationId, beforeId);
      const current = get().threads[conversationId]?.items ?? [];

      patch({
        items: mergeMessages(current, page),
        hasMore: page.length === chatService.PAGE_SIZE,
        loading: false,
      });
    } catch (error) {
      patch({ loading: false });
      showError(error);
    }
  },

  loadOlder: () => {
    const { selectedId, threads, loadThread } = get();
    const thread = selectedId !== null ? threads[selectedId] : undefined;
    if (selectedId === null || !thread || thread.loading || thread.items.length === 0) return;

    loadThread(selectedId, thread.items[0].id);
  },

  select: (conversationId) => {
    set((state) => {
      if (conversationId === null) return { selectedId: null };

      const unread = new Set(state.unread);
      unread.delete(conversationId);
      return { selectedId: conversationId, unread };
    });

    if (conversationId !== null && !get().threads[conversationId]) {
      get().loadThread(conversationId);
    }
  },

  send: async (content) => {
    const { selectedId, receiveMessage } = get();
    if (selectedId === null) return false;

    try {
      receiveMessage(await chatService.sendMessage(selectedId, content));
      return true;
    } catch (error) {
      showError(error);
      return false;
    }
  },

  openDirect: (email) =>
    attempt(async () => {
      const [other] = await resolveEmails([email]);
      enter(await chatService.openDirect(other.id));
    }),

  createGroup: (name, emails) =>
    attempt(async () => {
      const members = await resolveEmails(emails);
      enter(
        await chatService.createGroup(
          name,
          members.map((u) => u.id),
        ),
      );
    }),

  joinGroup: (conversationId) =>
    attempt(async () => enter(await chatService.joinGroup(conversationId))),

  addMembers: (emails) =>
    attempt(async () => {
      const { selectedId, upsertConversation } = get();
      if (selectedId === null) return;

      const members = await resolveEmails(emails);
      upsertConversation(
        await chatService.addMembers(
          selectedId,
          members.map((u) => u.id),
        ),
      );
    }),

  leaveGroup: () =>
    attempt(async () => {
      const { selectedId, removeConversation } = get();
      if (selectedId === null) return;

      await chatService.leaveGroup(selectedId);
      // Don't wait for the WebSocket event: this tab updates right away.
      removeConversation(selectedId);
    }),
}));

// ---- helpers shared by the actions above ------------------------------------

/** Runs an action, showing any error as a toast. Resolves to whether it worked. */
async function attempt(action: () => Promise<void>): Promise<boolean> {
  try {
    await action();
    return true;
  } catch (error) {
    showError(error);
    return false;
  }
}

/** Looks up users by e-mail and caches their names, failing on the first unknown one. */
async function resolveEmails(emails: string[]): Promise<User[]> {
  const users = await Promise.all(
    emails.map((email) =>
      findUserByEmail(email).catch(() => {
        throw new Error(`Nenhum usuário com o e-mail ${email}`);
      }),
    ),
  );

  useChatStore.setState((state) => ({
    users: { ...state.users, ...Object.fromEntries(users.map((u) => [u.id, u])) },
  }));
  return users;
}

/** Adds the conversation to the list (if new) and opens it. */
function enter(conversation: Conversation) {
  const { upsertConversation, select } = useChatStore.getState();
  upsertConversation(conversation);
  select(conversation.id);
}
