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
