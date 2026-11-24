import { toast } from "sonner";

import { useCallStore, type ActiveCall } from "@/features/call";

import { useChatStore } from "../store/chat.store";
import { conversationTitle } from "./conversation";

const toastId = (conversationId: number) => `call-${conversationId}`;

export const peopleLabel = (count: number) => (count === 1 ? "1 pessoa" : `${count} pessoas`);

export function joinCall(conversationId: number): Promise<boolean> {
  const { me, select } = useChatStore.getState();
  if (!me) return Promise.resolve(false);

  select(conversationId);
  toast.dismiss(toastId(conversationId));
  return useCallStore.getState().join(conversationId, me.id);
}

// Rings when a call starts in one of your conversations; stops when it ends.
export function announceCall({ conversation_id, participant_ids }: ActiveCall) {
  const { me, users, conversations } = useChatStore.getState();
  const wasActive = (useCallStore.getState().active[conversation_id]?.length ?? 0) > 0;

  if (participant_ids.length === 0) {
    toast.dismiss(toastId(conversation_id));
    return;
  }

  const conversation = conversations.find((c) => c.id === conversation_id);
  if (wasActive || !me || !conversation || participant_ids.includes(me.id)) return;

  const caller = users[participant_ids[0]]?.name ?? "Alguém";
  toast(
    conversation.is_group
      ? `Chamada iniciada em ${conversationTitle(conversation, me.id, users)}`
      : `${caller} está te ligando`,
    {
      id: toastId(conversation_id),
      duration: 30_000,
      action: { label: "Entrar", onClick: () => void joinCall(conversation_id) },
    },
  );
}
