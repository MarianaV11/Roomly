import axios from "@/services/axios.service";

import type { Conversation, Message } from "../types/chat";

export const PAGE_SIZE = 50;

export async function listConversations(): Promise<Conversation[]> {
  const { data } = await axios.get<Conversation[]>("/chat/conversations");
  return data;
}

/** The direct conversation with someone; the backend reuses an existing one. */
export async function openDirect(userId: number): Promise<Conversation> {
  const { data } = await axios.post<Conversation>("/chat/conversations/direct", {
    user_id: userId,
  });
  return data;
}

export async function createGroup(name: string, memberIds: number[]): Promise<Conversation> {
  const { data } = await axios.post<Conversation>("/chat/conversations/groups", {
    name,
    member_ids: memberIds,
  });
  return data;
}

export async function searchGroups(search: string): Promise<Conversation[]> {
  const { data } = await axios.get<Conversation[]>("/chat/conversations/groups", {
    params: { search, limit: 30 },
  });
  return data;
}

export async function joinGroup(conversationId: number, password?: string): Promise<Conversation> {
  const { data } = await axios.post<Conversation>(`/chat/conversations/${conversationId}/join`, {
    password,
  });
  return data;
}

/** Owner only. null removes the password. */
export async function setGroupPassword(
  conversationId: number,
  password: string | null,
): Promise<Conversation> {
  const { data } = await axios.put<Conversation>(
    `/chat/conversations/${conversationId}/password`,
    { password },
  );
  return data;
}

export async function addMembers(
  conversationId: number,
  memberIds: number[],
): Promise<Conversation> {
  const { data } = await axios.post<Conversation>(`/chat/conversations/${conversationId}/members`, {
    member_ids: memberIds,
  });
  return data;
}

/** Leaves a group. If you were the last member, the group is deleted. */
export async function leaveGroup(conversationId: number): Promise<void> {
  await axios.post(`/chat/conversations/${conversationId}/leave`);
}

export async function listMessages(conversationId: number, beforeId?: number): Promise<Message[]> {
  const { data } = await axios.get<Message[]>(`/chat/conversations/${conversationId}/messages`, {
    params: { limit: PAGE_SIZE, before_id: beforeId },
  });
  return data;
}

export async function sendMessage(conversationId: number, content: string): Promise<Message> {
  const { data } = await axios.post<Message>(`/chat/conversations/${conversationId}/messages`, {
    content,
  });
  return data;
}

export async function listOnline(userIds: number[]): Promise<number[]> {
  if (userIds.length === 0) return [];

  const { data } = await axios.get<number[]>("/chat/online", {
    params: { user_ids: userIds.slice(0, 100) },
    paramsSerializer: { indexes: null }, // user_ids=1&user_ids=2, the format FastAPI expects
  });
  return data;
}
