"use client";

import { RiZoomInLine, RiZoomOutLine } from "@remixicon/react";
import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const OUTPUT_SIZE = 512;
const MAX_ZOOM = 4;


async function cropToFile(src: string, area: Area): Promise<File> {
  const image = new Image();
  image.src = src;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  canvas
    .getContext("2d")!
    .drawImage(image, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.9),
  );
  if (!blob) throw new Error("Não foi possível ajustar a imagem.");

  const extension = blob.type === "image/webp" ? "webp" : "png";
  return new File([blob], `profile.${extension}`, { type: blob.type });
}

type Props = {
  src: string | null;
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void>;
};

export function AvatarCropDialog({ src, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!src || !area) return;
    setSaving(true);
    try {
      await onConfirm(await cropToFile(src, area));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={src !== null}
      onOpenChange={(open) => {
        if (!open && !saving) onCancel();
      }}
      // Each new image starts centered and unzoomed.
      onOpenChangeComplete={(open) => {
        if (!open) {
          setCrop({ x: 0, y: 0 });
          setZoom(1);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar foto</DialogTitle>
          <DialogDescription>
            Arraste para posicionar e use o zoom para enquadrar.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-72 overflow-hidden rounded-lg bg-muted">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              maxZoom={MAX_ZOOM}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Diminuir zoom"
            disabled={zoom <= 1}
            onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
          >
            <RiZoomOutLine />
          </Button>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            aria-label="Zoom"
            className="h-1.5 flex-1 cursor-pointer accent-primary"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Aumentar zoom"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.25))}
          >
            <RiZoomInLine />
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !area}>
            {saving ? "Salvando…" : "Salvar foto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
