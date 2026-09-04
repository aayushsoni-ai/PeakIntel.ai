"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface User {
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isHydrated: boolean;
  login: (userData?: Partial<User>) => void;
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      isHydrated: false,
      login: (userData) =>
        set({
          isAuthenticated: true,
          user: {
            name: userData?.name || "Saurabh Soni",
            email: userData?.email || "saurabh@peakintel.ai",
            role: userData?.role || "Senior Investment Partner",
          },
        }),
      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
        }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: "peakintel-auth",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
