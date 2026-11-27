import axios from "@/services/axios.service";

import type { User } from "../types/user";

export async function getMe(): Promise<User> {
  const { data } = await axios.get<User>("/user/me");
  return data;
}

export async function getUser(id: number): Promise<User> {
  const { data } = await axios.get<User>(`/user/${id}`);
  return data;
}

export async function findUserByEmail(email: string): Promise<User> {
  const { data } = await axios.get<User>("/user/search", { params: { email } });
  return data;
}

export const MAX_GIF_AVATAR_BYTES = 10 * 1024 * 1024;
export const AVATAR_TYPES = "image/png,image/jpeg,image/gif,image/webp";

export async function uploadAvatar(file: File): Promise<User> {
  const body = new FormData();
  body.append("file", file);
  const { data } = await axios.put<User>("/user/me/avatar", body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function removeAvatar(): Promise<void> {
  await axios.delete("/user/me/avatar");
}

export async function deleteMe(): Promise<void> {
  await axios.delete("/user/me");
}
