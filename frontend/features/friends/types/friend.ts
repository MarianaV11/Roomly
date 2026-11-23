import type { User } from "@/features/users";

export type Friendship = {
  id: number;
  status: "pending" | "accepted";
  direction: "incoming" | "outgoing";
  user: User;
  created_at: string;
};
