"use client";

import { Popover } from "@base-ui/react/popover";
import { RiEmotionLine } from "@remixicon/react";
import { EmojiPicker } from "frimousse";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function EmojiButton({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        render={<Button type="button" variant="ghost" size="icon" aria-label="Inserir emoji" />}
      >
        <RiEmotionLine />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="top" align="start" sideOffset={8} className="z-50">
          <Popover.Popup className="origin-(--transform-origin) rounded-xl border bg-popover text-popover-foreground shadow-lg outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-safe:transition-[transform,opacity] motion-safe:duration-150">
            <EmojiPicker.Root
              locale="pt"
              columns={8}
              className="flex h-80 w-[19rem] flex-col"
              onEmojiSelect={({ emoji }) => onPick(emoji)}
            >
              <EmojiPicker.Search
                placeholder="Buscar emoji"
                aria-label="Buscar emoji"
                className="m-2 h-8 rounded-md border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                autoFocus
              />
              <EmojiPicker.Viewport className="relative flex-1 outline-none">
                <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  Carregando…
                </EmojiPicker.Loading>
                <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  Nenhum emoji encontrado.
                </EmojiPicker.Empty>
                <EmojiPicker.List
                  className="pb-1.5 select-none"
                  components={{
                    CategoryHeader: ({ category, ...props }) => (
                      <div
                        className="bg-popover px-3 pt-2.5 pb-1 text-xs font-medium text-muted-foreground"
                        {...props}
                      >
                        {category.label}
                      </div>
                    ),
                    Row: ({ children, ...props }) => (
                      <div className="scroll-my-1.5 px-1.5" {...props}>
                        {children}
                      </div>
                    ),
                    Emoji: ({ emoji, ...props }) => (
                      <button
                        className="flex size-9 items-center justify-center rounded-md text-xl data-active:bg-muted"
                        {...props}
                      >
                        {emoji.emoji}
                      </button>
                    ),
                  }}
                />
              </EmojiPicker.Viewport>
            </EmojiPicker.Root>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
