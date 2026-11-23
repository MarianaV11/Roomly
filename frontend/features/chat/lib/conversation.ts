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

export function memberCountLabel(count: number): string {
  return count === 1 ? "1 membro" : `${count} membros`;
}
