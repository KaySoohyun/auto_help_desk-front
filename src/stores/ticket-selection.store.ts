import { create } from "zustand";

interface TicketSelectionStore {
  selectedIds: number[];
  toggle: (ticketId: number) => void;
  selectMany: (ticketIds: number[]) => void;
  clear: () => void;
  setAll: (ticketIds: number[]) => void;
}

export const useTicketSelectionStore = create<TicketSelectionStore>((set) => ({
  selectedIds: [],

  toggle: (ticketId) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(ticketId)
        ? s.selectedIds.filter((id) => id !== ticketId)
        : [...s.selectedIds, ticketId],
    })),

  selectMany: (ticketIds) =>
    set((s) => ({
      selectedIds: Array.from(new Set([...s.selectedIds, ...ticketIds])),
    })),

  clear: () => set({ selectedIds: [] }),

  setAll: (ticketIds) => set({ selectedIds: ticketIds }),
}));
