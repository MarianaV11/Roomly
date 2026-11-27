"use client";

import {
  RiComputerLine,
  RiFullscreenLine,
  RiMicLine,
  RiMicOffLine,
  RiPhoneFill,
  RiPhoneLine,
  RiStopCircleLine,
} from "@remixicon/react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { canShareScreen, useCallStore } from "@/features/call";
import { UserAvatar } from "@/features/users";
import { cn } from "@/lib/utils";

import { joinCall, peopleLabel } from "../lib/call";
import { conversationTitle } from "../lib/conversation";
import { useChatStore } from "../store/chat.store";

const NOBODY: number[] = [];

function useMediaElement<T extends HTMLMediaElement>(stream: MediaStream | null) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return ref;
}

function PeerAudio({ stream }: { stream: MediaStream }) {
  const ref = useMediaElement<HTMLAudioElement>(stream);
  return <audio ref={ref} autoPlay />;
}

export function CallAudio() {
  const peers = useCallStore((state) => state.current?.peers);
  if (!peers) return null;

  return Object.entries(peers).map(
    ([id, peer]) => peer.audio && <PeerAudio key={id} stream={peer.audio} />,
  );
}

export function CallButton({ conversationId }: { conversationId: number }) {
  const inThisCall = useCallStore((state) => state.current?.conversationId === conversationId);
  const ongoing = useCallStore((state) => !!state.active[conversationId]);
  const joining = useCallStore((state) => state.joining);

  // An ongoing call is joined from CallStage, which also shows who is in it.
  if (inThisCall || ongoing) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Iniciar chamada de voz"
      disabled={joining}
      onClick={() => joinCall(conversationId)}
    >
      <RiPhoneLine />
    </Button>
  );
}

export function CallBar() {
  const current = useCallStore((state) => state.current);
  const joining = useCallStore((state) => state.joining);
  const participants = useCallStore((state) =>
    state.current ? (state.active[state.current.conversationId] ?? NOBODY) : NOBODY,
  );
  const { leave, toggleMute, startScreenShare, stopScreenShare } = useCallStore.getState();
  const conversation = useChatStore((state) =>
    state.conversations.find((c) => c.id === current?.conversationId),
  );
  const users = useChatStore((state) => state.users);
  const select = useChatStore((state) => state.select);

  if (!current) return null;

  const title = conversation ? conversationTitle(conversation, current.meId, users) : "Chamada";

  return (
    <div className="flex flex-col gap-2 border-t bg-emerald-500/5 p-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
      <button
        type="button"
        className="flex min-w-0 flex-col text-left"
        onClick={() => select(current.conversationId)}
      >
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {joining ? "Conectando…" : "Em chamada"}
        </span>
        <span className="truncate text-sm">
          {title} · {peopleLabel(participants.length || 1)}
        </span>
      </button>

      <div className="flex items-center gap-1">
        <Button
          variant={current.muted ? "destructive" : "ghost"}
          size="icon"
          aria-label={current.muted ? "Ativar microfone" : "Desativar microfone"}
          aria-pressed={current.muted}
          onClick={toggleMute}
        >
          {current.muted ? <RiMicOffLine /> : <RiMicLine />}
        </Button>
        {canShareScreen() && (
          <Button
            variant={current.screen ? "secondary" : "ghost"}
            size="icon"
            aria-label={current.screen ? "Parar de compartilhar a tela" : "Compartilhar a tela"}
            aria-pressed={!!current.screen}
            onClick={current.screen ? stopScreenShare : startScreenShare}
          >
            {current.screen ? <RiStopCircleLine /> : <RiComputerLine />}
          </Button>
        )}
        <Button
          variant="destructive"
          size="icon"
          className="ml-auto"
          aria-label="Sair da chamada"
          onClick={leave}
        >
          <RiPhoneFill className="rotate-135" />
        </Button>
      </div>
    </div>
  );
}

function ScreenTile({ stream, label, own }: { stream: MediaStream; label: string; own?: boolean }) {
  const ref = useMediaElement<HTMLVideoElement>(stream);

  return (
    <figure className="group relative overflow-hidden rounded-lg border bg-black">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        className="aspect-video max-h-[45vh] w-full object-contain"
      />
      <figcaption className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
        {own ? "Sua tela" : `Tela de ${label}`}
      </figcaption>
      <Button
        variant="secondary"
        size="icon-sm"
        className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        aria-label="Tela cheia"
        onClick={() => ref.current?.requestFullscreen()}
      >
        <RiFullscreenLine />
      </Button>
    </figure>
  );
}

export function CallStage({ conversationId }: { conversationId: number }) {
  const current = useCallStore((state) =>
    state.current?.conversationId === conversationId ? state.current : null,
  );
  const participants = useCallStore((state) => state.active[conversationId] ?? NOBODY);
  const users = useChatStore((state) => state.users);
  const meId = useChatStore((state) => state.me?.id);
  const joining = useCallStore((state) => state.joining);
  const [collapsed, setCollapsed] = useState(false);

  // Outside the call you still see who is in it, and can join from here.
  if (!current && participants.length === 0) return null;

  const name = (id: number) => users[id]?.name ?? "…";
  const people = current && participants.length === 0 ? [current.meId] : participants;
  const screens = current
    ? [
        ...(current.screen ? [{ id: current.meId, stream: current.screen, own: true }] : []),
        ...Object.entries(current.peers).flatMap(([id, peer]) =>
          peer.screen ? [{ id: Number(id), stream: peer.screen, own: false }] : [],
        ),
      ]
    : [];

  return (
    <section
      aria-label="Chamada"
      className="flex flex-col gap-3 border-b bg-muted/30 p-3 motion-safe:animate-in motion-safe:fade-in"
    >
      {!current && (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <RiPhoneFill className="size-3.5 motion-safe:animate-pulse" />
          Chamada em andamento · {peopleLabel(people.length)}
        </span>
      )}
      <div className="flex items-center gap-3 overflow-x-auto">
        {people.map((id) => {
          const isMe = id === meId;
          const connecting = !!current && !isMe && current.peers[id]?.connection !== "connected";

          return (
            <div key={id} className="flex shrink-0 flex-col items-center gap-1">
              <div
                className={cn("rounded-full", connecting && "opacity-50 motion-safe:animate-pulse")}
              >
                <UserAvatar name={name(id)} src={users[id]?.avatar_url} size="lg" />
              </div>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {isMe ? "Você" : name(id)}
                {isMe && current?.muted && <RiMicOffLine className="size-3 text-destructive" />}
              </span>
            </div>
          );
        })}
        {!current && (
          <Button
            size="sm"
            className="ml-auto"
            disabled={joining}
            onClick={() => joinCall(conversationId)}
          >
            <RiPhoneLine /> Entrar na chamada
          </Button>
        )}
        {screens.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? "Mostrar telas" : "Esconder telas"}
          </Button>
        )}
      </div>

      {!collapsed && screens.length > 0 && (
        <div className={cn("grid gap-2", screens.length > 1 && "md:grid-cols-2")}>
          {screens.map((s) => (
            <ScreenTile key={s.id} stream={s.stream} label={name(s.id)} own={s.own} />
          ))}
        </div>
      )}
    </section>
  );
}
