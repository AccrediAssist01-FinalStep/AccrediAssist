'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  openGroups: Record<string, boolean>;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  toggleGroup: (groupId: string) => void;
  setGroupOpen: (groupId: string, open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      openGroups: {
        student: true,
        faculty: false,
        department: false,
      },
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setMobileOpen: (open) => set({ isMobileOpen: open }),
      toggleGroup: (groupId) =>
        set((state) => ({
          openGroups: {
            ...state.openGroups,
            [groupId]: !state.openGroups[groupId],
          },
        })),
      setGroupOpen: (groupId, open) =>
        set((state) => ({
          openGroups: {
            ...state.openGroups,
            [groupId]: open,
          },
        })),
    }),
    {
      name: 'sidebar-storage',
      partialize: (state) => ({
        isCollapsed: state.isCollapsed,
        openGroups: state.openGroups,
      }),
    },
  ),
);
