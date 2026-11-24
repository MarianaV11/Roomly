import type { ActiveCall, SignalPayload } from "@/features/call";

export type Conversation = {
  id: number;
  /** Always set for groups; null for direct conversations. */
  name: string | null;
  /** Groups are public (anyone can find and join) and can grow; direct = exactly 2 people. */
  is_group: boolean;
  member_ids: number[];
  created_at: string;
};

export type Message = {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
};

export type Thread = {
  items: Message[];
  hasMore: boolean;
  loading: boolean;
};

/** What the backend pushes over the WebSocket (see backend README, "Chat"). */
export type ChatEvent =
  | { type: "message"; data: Message }
  | { type: "conversation"; data: Conversation }
  /** You left the conversation (possibly from another tab). */
  | { type: "conversation_removed"; data: { id: number } }
  | { type: "presence"; data: { user_id: number; online: boolean } }
  | { type: "friends_changed"; data: null }
  | { type: "call_state"; data: ActiveCall }
  | { type: "call_signal"; data: { conversation_id: number; from: number; payload: SignalPayload } }
  | { type: "call_ended"; data: { conversation_id: number } }
  | { type: "error"; data: { detail: string } };
