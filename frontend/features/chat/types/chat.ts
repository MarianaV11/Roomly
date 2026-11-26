import type { ActiveCall, SignalPayload } from "@/features/call";

export type Conversation = {
  id: number;
  name: string | null;
  is_group: boolean;
  owner_id: number | null;
  has_password: boolean;
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

export type ChatEvent =
  | { type: "message"; data: Message }
  | { type: "conversation"; data: Conversation }
  | { type: "conversation_removed"; data: { id: number } }
  | { type: "presence"; data: { user_id: number; online: boolean } }
  | { type: "friends_changed"; data: null }
  | { type: "call_state"; data: ActiveCall }
  | { type: "call_signal"; data: { conversation_id: number; from: number; payload: SignalPayload } }
  | { type: "call_ended"; data: { conversation_id: number } }
  | { type: "error"; data: { detail: string } };
