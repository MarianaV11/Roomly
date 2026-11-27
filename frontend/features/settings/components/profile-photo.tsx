"use client";

import { RiDeleteBinLine, RiImageAddLine, RiLoader4Line } from "@remixicon/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AVATAR_TYPES,
  MAX_GIF_AVATAR_BYTES,
  removeAvatar,
  uploadAvatar,
  type User,
} from "@/features/users";

import { AvatarCropDialog } from "./avatar-crop-dialog";

type Props = {
  me: User;
  onChange: (me: User) => void;
};

export function ProfilePhoto({ me, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  function closeEditor() {
    if (editing) URL.revokeObjectURL(editing);
    setEditing(null);
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // picking the same file again still fires change
    if (!file) return;

    // A canvas would keep only the first frame, so GIFs go as they are, unadjusted.
    if (file.type === "image/gif") {
      if (file.size > MAX_GIF_AVATAR_BYTES) {
        toast.error("O GIF passa de 10 MB. Escolha um menor.");
        return;
      }
      upload(file);
      return;
    }

    // Other images are cropped to 512×512 before sending, so their original size doesn't matter.
    setEditing(URL.createObjectURL(file));
  }

  async function upload(file: File) {
    setBusy("upload");
    try {
      onChange(await uploadAvatar(file));
      toast.success("Foto de perfil atualizada.");
      closeEditor();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a foto.");
    } finally {
      setBusy(null);
    }
  }

  async function handleRemove() {
    setBusy("remove");
    try {
      await removeAvatar();
      onChange({ ...me, avatar_url: null });
      toast.success("Foto de perfil removida.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover a foto.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <AvatarCropDialog src={editing} onCancel={closeEditor} onConfirm={upload} />
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_TYPES}
        className="hidden"
        onChange={handleFile}
        aria-label="Escolher foto de perfil"
      />
      {me.avatar_url && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Remover foto"
          disabled={busy !== null}
          onClick={handleRemove}
        >
          {busy === "remove" ? (
            <RiLoader4Line className="motion-safe:animate-spin" />
          ) : (
            <RiDeleteBinLine />
          )}
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={busy !== null}
        onClick={() => inputRef.current?.click()}
      >
        {busy === "upload" ? (
          <RiLoader4Line className="motion-safe:animate-spin" />
        ) : (
          <RiImageAddLine />
        )}
        {busy === "upload" ? "Enviando…" : me.avatar_url ? "Trocar" : "Enviar"}
      </Button>
    </div>
  );
}
