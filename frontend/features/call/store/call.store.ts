import { toast } from "sonner";
import { create } from "zustand";

import { ICE_SERVERS } from "@/services/env.service";

import type { ActiveCall, CallClientEvent, CurrentCall, Peer, SignalPayload } from "../types/call";

// One RTCPeerConnection per other participant (mesh), negotiated with the W3C
// "perfect negotiation" pattern: either side may (re)negotiate, e.g. when a screen
// share starts, and the polite side yields when both offer at the same time.
// ponytail: mesh = each person uploads to every other; fine up to ~6 people.
// Past that, route media through an SFU (LiveKit, mediasoup).
type Link = {
  pc: RTCPeerConnection;
  polite: boolean;
  makingOffer: boolean;
  ignoreOffer: boolean;
  screenSender: RTCRtpSender | null;
  signal: (payload: SignalPayload) => void;
};

type CallState = {
  active: Record<number, number[]>;
  current: CurrentCall | null;
  joining: boolean;

  setActive: (calls: ActiveCall[]) => void;
  applyState: (call: ActiveCall) => void;
  join: (conversationId: number, meId: number) => Promise<boolean>;
  leave: () => void;
  end: (conversationId: number, reason?: string) => void;
  joinFailed: (detail: string) => void;
  disconnected: () => void;
  toggleMute: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  handleSignal: (conversationId: number, from: number, payload: SignalPayload) => Promise<void>;
};

let send: (event: CallClientEvent) => void = () => {};

export function setCallSender(sender: (event: CallClientEvent) => void) {
  send = sender;
}

export const canShareScreen = () =>
  typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia;

const links = new Map<number, Link>();

const EMPTY_PEER: Peer = { audio: null, screen: null, connection: "new" };

export const useCallStore = create<CallState>()((set, get) => {
  function updatePeer(peerId: number, patch: Partial<Peer>) {
    set((state) => {
      if (!state.current) return state;
      const peers = state.current.peers;
      return {
        current: {
          ...state.current,
          peers: { ...peers, [peerId]: { ...EMPTY_PEER, ...peers[peerId], ...patch } },
        },
      };
    });
  }

  function closeLink(peerId: number) {
    links.get(peerId)?.pc.close();
    links.delete(peerId);
    set((state) => {
      if (!state.current) return state;
      const peers = { ...state.current.peers };
      delete peers[peerId];
      return { current: { ...state.current, peers } };
    });
  }

  function linkTo(peerId: number): Link {
    const existing = links.get(peerId);
    if (existing) return existing;

    const current = get().current!;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const link: Link = {
      pc,
      polite: current.meId < peerId,
      makingOffer: false,
      ignoreOffer: false,
      screenSender: null,
      signal: (payload) =>
        send({
          type: "call_signal",
          data: { conversation_id: current.conversationId, to: peerId, payload },
        }),
    };
    links.set(peerId, link);
    updatePeer(peerId, {});

    for (const track of current.local.getAudioTracks()) pc.addTrack(track, current.local);
    const screenTrack = current.screen?.getVideoTracks()[0];
    if (screenTrack) link.screenSender = pc.addTrack(screenTrack, current.screen!);

    pc.onnegotiationneeded = async () => {
      try {
        link.makingOffer = true;
        await pc.setLocalDescription();
        link.signal({ description: pc.localDescription!.toJSON() });
      } catch (error) {
        console.error(error);
      } finally {
        link.makingOffer = false;
      }
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) link.signal({ candidate: candidate.toJSON() });
    };

    // The only video anyone sends is a screen share, so kind tells them apart.
    pc.ontrack = ({ track, streams: [stream] }) => {
      const key = track.kind === "audio" ? "audio" : "screen";
      const media = stream ?? new MediaStream([track]);
      updatePeer(peerId, { [key]: media });
      media.addEventListener("removetrack", () => {
        if (media.getTracks().length === 0) updatePeer(peerId, { [key]: null });
      });
    };

    pc.onconnectionstatechange = () => {
      updatePeer(peerId, { connection: pc.connectionState });
      if (pc.connectionState === "failed") pc.restartIce();
    };

    return link;
  }

  function teardown() {
    for (const peerId of links.keys()) links.get(peerId)?.pc.close();
    links.clear();

    const current = get().current;
    current?.local.getTracks().forEach((track) => track.stop());
    current?.screen?.getTracks().forEach((track) => track.stop());

    set({ current: null, joining: false });
  }

  return {
    active: {},
    current: null,
    joining: false,

    setActive: (calls) =>
      set({ active: Object.fromEntries(calls.map((c) => [c.conversation_id, c.participant_ids])) }),

    applyState: ({ conversation_id, participant_ids }) => {
      set((state) => {
        const active = { ...state.active };
        if (participant_ids.length) active[conversation_id] = participant_ids;
        else delete active[conversation_id];
        return { active };
      });

      const current = get().current;
      if (current?.conversationId !== conversation_id) return;
      if (!participant_ids.includes(current.meId)) return;

      set({ joining: false });
      for (const peerId of links.keys()) {
        if (!participant_ids.includes(peerId)) closeLink(peerId);
      }
      // Only the impolite side (higher id) starts; the other answers when the offer
      // arrives. Avoids both offering at once on every join.
      for (const peerId of participant_ids) {
        if (peerId < current.meId) linkTo(peerId);
      }
    },

    join: async (conversationId, meId) => {
      if (get().current) get().leave();

      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Este navegador não permite chamadas aqui (é preciso HTTPS).");
        return false;
      }

      set({ joining: true });
      let local: MediaStream;
      try {
        local = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch {
        set({ joining: false });
        toast.error("Não foi possível usar o microfone. Verifique a permissão do navegador.");
        return false;
      }

      set({ current: { conversationId, meId, muted: false, local, screen: null, peers: {} } });
      send({ type: "call_join", data: { conversation_id: conversationId } });
      return true;
    },

    leave: () => {
      const current = get().current;
      if (!current) return;
      send({ type: "call_leave", data: { conversation_id: current.conversationId } });
      teardown();
    },

    end: (conversationId, reason) => {
      if (get().current?.conversationId !== conversationId) return;
      teardown();
      if (reason) toast(reason);
    },

    joinFailed: (detail) => {
      if (!get().joining) return;
      teardown();
      toast.error(detail);
    },

    disconnected: () => {
      if (!get().current) return;
      teardown();
      toast.error("A conexão caiu e a chamada foi encerrada.");
    },

    toggleMute: () => {
      const current = get().current;
      if (!current) return;
      const muted = !current.muted;
      current.local.getAudioTracks().forEach((track) => (track.enabled = !muted));
      set({ current: { ...current, muted } });
    },

    startScreenShare: async () => {
      if (!get().current || get().current?.screen) return;

      let screen: MediaStream;
      try {
        screen = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 30, max: 30 } },
          audio: false,
        });
      } catch {
        return; // the user closed the picker
      }

      const current = get().current;
      if (!current) {
        screen.getTracks().forEach((track) => track.stop());
        return;
      }

      const [track] = screen.getVideoTracks();
      track.contentHint = "detail";
      // The browser's own "Stop sharing" button.
      track.addEventListener("ended", () => get().stopScreenShare());

      for (const link of links.values()) link.screenSender = link.pc.addTrack(track, screen);
      set({ current: { ...current, screen } });
    },

    stopScreenShare: () => {
      const current = get().current;
      if (!current?.screen) return;

      for (const link of links.values()) {
        if (link.screenSender) link.pc.removeTrack(link.screenSender);
        link.screenSender = null;
      }
      current.screen.getTracks().forEach((track) => track.stop());
      set({ current: { ...current, screen: null } });
    },

    handleSignal: async (conversationId, from, { description, candidate }) => {
      if (get().current?.conversationId !== conversationId) return;

      const link = linkTo(from);
      const { pc } = link;

      try {
        if (description) {
          const collision =
            description.type === "offer" && (link.makingOffer || pc.signalingState !== "stable");
          link.ignoreOffer = !link.polite && collision;
          if (link.ignoreOffer) return;

          await pc.setRemoteDescription(description);
          if (description.type === "offer") {
            await pc.setLocalDescription();
            link.signal({ description: pc.localDescription!.toJSON() });
          }
        } else if (candidate) {
          try {
            await pc.addIceCandidate(candidate);
          } catch (error) {
            if (!link.ignoreOffer) throw error;
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
  };
});
