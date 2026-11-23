import type { User } from "@/features/users";
import axios from "@/services/axios.service";

type TokenResponse = { access_token: string; token_type: string };

export async function login(email: string, password: string): Promise<TokenResponse> {
  const { data } = await axios.post<TokenResponse>("/auth/login", { email, password });
  return data;
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const { data } = await axios.post<User>("/auth/register", { name, email, password });
  return data;
}
