"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Mock de favoritos: guarda los ids de productos guardados por el usuario.
 * Solo persistencia local (sin backend) — mismo símil que el carrito.
 */
interface FavoritesState {
  ids: string[];
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
  count: () => number;
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (productId) =>
        set((s) => ({
          ids: s.ids.includes(productId)
            ? s.ids.filter((id) => id !== productId)
            : [...s.ids, productId],
        })),
      has: (productId) => get().ids.includes(productId),
      clear: () => set({ ids: [] }),
      count: () => get().ids.length,
    }),
    { name: "starshop-favorites" }
  )
);