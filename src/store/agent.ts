"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type ChatMsg = { role: "user" | "agent"; text: string };

interface AgentState {
  isOpen: boolean;
  pendingProduct: string | null;
  messages: ChatMsg[];
  setOpen: (open: boolean) => void;
  setPendingProduct: (name: string | null) => void;
  openWithProduct: (productName: string) => void;
  setMessages: (msgs: ChatMsg[] | ((prev: ChatMsg[]) => ChatMsg[])) => void;
  clearMessages: () => void;
}

const DEFAULT_MSG: ChatMsg = { role: "agent", text: "Hola! Soy Star, tu asistente de Starshop. ¿En qué te ayudo hoy?" };

export const useAgent = create<AgentState>()(
  persist(
    (set) => ({
      isOpen: false,
      pendingProduct: null,
      messages: [DEFAULT_MSG],
      setOpen: (isOpen) => set({ isOpen }),
      setPendingProduct: (pendingProduct) => set({ pendingProduct }),
      openWithProduct: (productName: string) => set({ isOpen: true, pendingProduct: productName }),
      setMessages: (msgs) => set((s) => ({ messages: typeof msgs === "function" ? (msgs as (p: ChatMsg[]) => ChatMsg[])(s.messages) : msgs })),
      clearMessages: () => set({ messages: [DEFAULT_MSG] }),
    }),
    { name: "starshop-agent", partialize: (s) => ({ messages: s.messages, isOpen: s.isOpen }) }
  )
);
