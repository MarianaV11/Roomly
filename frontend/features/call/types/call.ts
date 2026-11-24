export type ActiveCall = {
  conversation_id: number;
  participant_ids: number[];
};

export type SignalPayload = {
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

export type CallClientEvent =
  | { type: "call_join"; data: { conversation_id: number } }
  | { type: "call_leave"; data: { conversation_id: number } }
  | { type: "call_signal"; data: { conversation_id: number; to: number; payload: SignalPayload } };

export type Peer = {
  audio: MediaStream | null;
  screen: MediaStream | null;
  connection: RTCPeerConnectionState;
};

export type CurrentCall = {
  conversationId: number;
  meId: number;
  muted: boolean;
  local: MediaStream;
  screen: MediaStream | null;
  peers: Record<number, Peer>;
};
