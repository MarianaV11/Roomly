"use client";

import { RiCompass3Line, RiLoader4Line, RiLockLine, RiSearchLine } from "@remixicon/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/features/users";

import { memberCountLabel } from "../lib/conversation";
import { searchGroups } from "../services/chat.service";
import { showError, useChatStore } from "../store/chat.store";
import type { Conversation } from "../types/chat";

const SEARCH_DELAY_MS = 300;

export function ExploreGroupsDialog() {
  const meId = useChatStore((state) => state.me?.id);
  const joinGroup = useChatStore((state) => state.joinGroup);
  const select = useChatStore((state) => state.select);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Conversation[] | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const [askingId, setAskingId] = useState<number | null>(null);
  const [password, setPassword] = useState("");

  // Search while the dialog is open, waiting for the user to stop typing.
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      searchGroups(query.trim())
        .then((groups) => !cancelled && setResults(groups))
        .catch(showError);
    }, SEARCH_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query]);

  async function handleOpenGroup(group: Conversation, isMember: boolean) {
    if (isMember) {
      select(group.id);
      setOpen(false);
      return;
    }

    if (group.has_password && askingId !== group.id) {
      setAskingId(group.id);
      setPassword("");
      return;
    }

    setJoiningId(group.id);
    if (await joinGroup(group.id, group.has_password ? password : undefined)) setOpen(false);
    setJoiningId(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="Explorar grupos" />}>
        <RiCompass3Line />
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Explorar grupos</DialogTitle>
          <DialogDescription>
            Entre em qualquer grupo. Os com cadeado pedem senha.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <RiSearchLine className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar pelo nome"
            aria-label="Buscar grupos pelo nome"
            className="pl-8"
            maxLength={100}
            autoFocus
          />
        </div>

        <div className="-mx-1 max-h-80 overflow-y-auto px-1" aria-live="polite">
          {results === null ? (
            <div className="flex justify-center py-6 text-muted-foreground">
              <RiLoader4Line className="size-5 motion-safe:animate-spin" aria-label="Buscando" />
            </div>
          ) : results.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground motion-safe:animate-in motion-safe:fade-in">
              {query.trim()
                ? "Nenhum grupo com esse nome."
                : "Ainda não há grupos. Crie o primeiro!"}
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {results.map((group, index) => {
                const isMember = meId !== undefined && group.member_ids.includes(meId);
                const asking = !isMember && askingId === group.id;

                return (
                  <li
                    key={group.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted motion-safe:animate-in motion-safe:fill-mode-backwards motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
                    // Stagger: each row starts a little after the previous one.
                    style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
                  >
                    <UserAvatar name={group.name ?? "Grupo"} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-center gap-1 truncate text-sm font-medium">
                        {group.name}
                        {group.has_password && (
                          <RiLockLine className="size-3.5 shrink-0 text-muted-foreground" aria-label="Com senha" />
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {memberCountLabel(group.member_ids.length)}
                      </span>
                    </div>
                    {!asking && (
                      <Button
                        size="sm"
                        variant={isMember ? "outline" : "default"}
                        disabled={joiningId !== null}
                        onClick={() => handleOpenGroup(group, isMember)}
                      >
                        {joiningId === group.id ? "Entrando…" : isMember ? "Abrir" : "Entrar"}
                      </Button>
                    )}
                    {asking && (
                      <form
                        className="flex w-full gap-2 motion-safe:animate-in motion-safe:fade-in"
                        onSubmit={(event) => {
                          event.preventDefault();
                          handleOpenGroup(group, false);
                        }}
                      >
                        <Input
                          type="password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="Senha do grupo"
                          aria-label={`Senha de ${group.name}`}
                          maxLength={128}
                          autoFocus
                        />
                        <Button size="sm" type="submit" disabled={joiningId !== null || !password}>
                          {joiningId === group.id ? "Entrando…" : "Entrar"}
                        </Button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
