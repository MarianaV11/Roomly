import { RiGroupLine } from "@remixicon/react";

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase() || "?";
}

type Props = {
  name: string;
  online?: boolean;
  /** Shows a group icon instead of initials. */
  group?: boolean;
  size?: "default" | "sm" | "lg";
};

export function UserAvatar({ name, online, group, size = "default" }: Props) {
  return (
    <Avatar size={size}>
      <AvatarFallback className={group ? "bg-primary/10 text-primary" : undefined}>
        {group ? <RiGroupLine className="size-4" aria-hidden /> : initials(name)}
      </AvatarFallback>
      {online && (
        // Pops in when someone comes online.
        <AvatarBadge
          className="bg-emerald-500 motion-safe:animate-in motion-safe:duration-300 motion-safe:zoom-in"
          aria-label="online"
        />
      )}
    </Avatar>
  );
}
