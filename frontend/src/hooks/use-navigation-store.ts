'use client';

import { create } from 'zustand';

interface NavigationState {
  pendingPath: string | null;
  setPendingPath: (path: string | null) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  pendingPath: null,
  setPendingPath: (pendingPath) => set({ pendingPath }),
}));
