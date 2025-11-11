import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  modalOpen: false,
  modalType: null,
  loading: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebar })),
  setSidebar: (open) => set({ sidebarOpen: open }),
  
  openModal: (type) => set({ modalOpen: true, modalType: type }),
  closeModal: () => set({ modalOpen: false, modalType: null }),
  
  setLoading: (loading) => set({ loading }),
}));