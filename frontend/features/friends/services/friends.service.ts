import axios from "@/services/axios.service";

import type { Friendship } from "../types/friend";

export async function listFriendships(): Promise<Friendship[]> {
  const { data } = await axios.get<Friendship[]>("/friends");
  return data;
}

export async function sendFriendRequest(email: string): Promise<Friendship> {
  const { data } = await axios.post<Friendship>("/friends", { email });
  return data;
}

export async function acceptFriendRequest(id: number): Promise<Friendship> {
  const { data } = await axios.post<Friendship>(`/friends/${id}/accept`);
  return data;
}

export async function removeFriendship(id: number): Promise<void> {
  await axios.delete(`/friends/${id}`);
}
