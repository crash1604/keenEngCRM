import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false, // Added collapsed state
  modalOpen: false,
  modalType: null,
  loading: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })), // Fixed typo here
  setSidebar: (open) => set({ sidebarOpen: open }),
  
  // New sidebar collapse methods
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  openModal: (type) => set({ modalOpen: true, modalType: type }),
  closeModal: () => set({ modalOpen: false, modalType: null }),
  
  setLoading: (loading) => set({ loading }),
}));