import axios from "@/services/axios.service";

import type { ActiveCall } from "../types/call";

export async function listActiveCalls(): Promise<ActiveCall[]> {
  const { data } = await axios.get<ActiveCall[]>("/chat/calls");
  return data;
}
