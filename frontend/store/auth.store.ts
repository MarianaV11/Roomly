import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  token: string | null;
  hydrated: boolean;
  setToken: (token: string) => void;
  clearAuth: () => void;
};

export const AUTH_STORAGE_KEY = "roomly-auth";

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      hydrated: false,
      setToken: (token) => set({ token }),
      clearAuth: () => set({ token: null }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({ token: state.token }),
      skipHydration: true,
      onRehydrateStorage: () => () => useAuth.setState({ hydrated: true }),
    },
  ),
);
