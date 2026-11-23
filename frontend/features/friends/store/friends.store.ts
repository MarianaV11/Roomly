import { toast } from "sonner";
import { create } from "zustand";

import * as friendsService from "../services/friends.service";
import type { Friendship } from "../types/friend";

function showError(error: unknown) {
  toast.error(error instanceof Error ? error.message : "Algo deu errado.");
}

type FriendsState = {
  items: Friendship[];

  reset: () => void;
  load: () => Promise<void>;
  send: (email: string) => Promise<boolean>;
  accept: (id: number) => Promise<boolean>;
  remove: (id: number) => Promise<boolean>;
};

export const useFriendsStore = create<FriendsState>()((set, get) => {
  async function attempt(action: () => Promise<unknown>): Promise<boolean> {
    try {
      await action();
      await get().load();
      return true;
    } catch (error) {
      showError(error);
      return false;
    }
  }

  return {
    items: [],

    reset: () => set({ items: [] }),

    load: () => friendsService.listFriendships().then((items) => set({ items }), showError),

    send: (email) =>
      attempt(async () => {
        const friendship = await friendsService.sendFriendRequest(email);
        toast.success(
          friendship.status === "accepted"
            ? `Você e ${friendship.user.name} agora são amigos!`
            : `Pedido enviado para ${friendship.user.name}.`,
        );
      }),

    accept: (id) => attempt(() => friendsService.acceptFriendRequest(id)),

    remove: (id) => attempt(() => friendsService.removeFriendship(id)),
  };
});
