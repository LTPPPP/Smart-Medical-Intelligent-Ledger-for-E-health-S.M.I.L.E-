// ============================================================
// Sidebar UI state — Zustand
// ============================================================

import { create } from "zustand";

interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
}

interface SidebarActions {
  toggle: () => void;
  open: () => void;
  close: () => void;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

type SidebarStore = SidebarState & SidebarActions;

export const useSidebarStore = create<SidebarStore>()((set) => ({
  isOpen: false,
  isCollapsed: false,

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggleCollapse: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
  setCollapsed: (isCollapsed) => set({ isCollapsed }),
}));

// ─── Typed selectors ────────────────────────────────────────
export const useSidebarOpen = () => useSidebarStore((s) => s.isOpen);
export const useSidebarCollapsed = () => useSidebarStore((s) => s.isCollapsed);
