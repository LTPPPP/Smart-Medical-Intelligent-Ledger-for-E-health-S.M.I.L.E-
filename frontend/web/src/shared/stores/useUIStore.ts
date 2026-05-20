// ============================================================
// Global UI state — Zustand
// Modals, command palette, and other cross-cutting UI concerns
// ============================================================

import { create } from "zustand";

interface UIState {
  isCommandPaletteOpen: boolean;
  isMobileMenuOpen: boolean;
}

interface UIActions {
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  resetUI: () => void;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  isCommandPaletteOpen: false,
  isMobileMenuOpen: false,
};

export const useUIStore = create<UIStore>()((set) => ({
  ...initialState,

  setCommandPaletteOpen: (isCommandPaletteOpen) =>
    set({ isCommandPaletteOpen }),
  toggleCommandPalette: () =>
    set((s) => ({ isCommandPaletteOpen: !s.isCommandPaletteOpen })),
  setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
  resetUI: () => set(initialState),
}));

// ─── Typed selectors ────────────────────────────────────────
export const useCommandPaletteOpen = () =>
  useUIStore((s) => s.isCommandPaletteOpen);
export const useMobileMenuOpen = () => useUIStore((s) => s.isMobileMenuOpen);
