"use client";

import { RequireAuth } from "@/features/auth";
import { ChatView } from "@/features/chat";

export default function Home() {
  return <RequireAuth>{(token) => <ChatView token={token} />}</RequireAuth>;
}
