import type { User } from "@/features/users";

import type { Conversation } from "../types/chat";

export function otherMemberIds(conversation: Conversation, meId: number | undefined): number[] {
  return conversation.member_ids.filter((id) => id !== meId);
}

export function conversationTitle(
  conversation: Conversation,
  meId: number | undefined,
  users: Record<number, User>,
): string {
  if (conversation.name) return conversation.name;

  const names = otherMemberIds(conversation, meId).map((id) => users[id]?.name ?? "…");
  return names.join(", ") || "Conversa";
}

// Groups have no picture; a direct conversation shows the other person's.
export function conversationAvatar(
  conversation: Conversation,
  meId: number | undefined,
  users: Record<number, User>,
): string | null {
  if (conversation.is_group) return null;
  const [other] = otherMemberIds(conversation, meId);
  return users[other]?.avatar_url ?? null;
}

export function memberCountLabel(count: number): string {
  return count === 1 ? "1 membro" : `${count} membros`;
}
