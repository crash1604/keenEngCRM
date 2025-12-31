import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Check system preference for dark mode
const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Apply theme to document
const applyTheme = (theme) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme === 'dark' ? 'dark' : 'light');
    // Set AG Grid theme mode (using 'dark-blue' for dark mode)
    document.body.dataset.agThemeMode = theme === 'dark' ? 'dark-blue' : 'light';
  }
};

export const useUIStore = create(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      modalOpen: false,
      modalType: null,
      loading: false,
      theme: 'light', // 'light', 'dark', or 'system'

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebar: (open) => set({ sidebarOpen: open }),

      // Sidebar collapse methods
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      openModal: (type) => set({ modalOpen: true, modalType: type }),
      closeModal: () => set({ modalOpen: false, modalType: null }),

      setLoading: (loading) => set({ loading }),

      // Theme methods
      setTheme: (newTheme) => {
        const effectiveTheme = newTheme === 'system' ? getSystemTheme() : newTheme;
        applyTheme(effectiveTheme);
        set({ theme: newTheme });
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        set({ theme: newTheme });
      },

      // Initialize theme on app load
      initializeTheme: () => {
        const theme = get().theme;
        const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
        applyTheme(effectiveTheme);

        // Listen for system theme changes when in 'system' mode
        if (typeof window !== 'undefined' && window.matchMedia) {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          mediaQuery.addEventListener('change', (e) => {
            if (get().theme === 'system') {
              applyTheme(e.matches ? 'dark' : 'light');
            }
          });
        }
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed
      }),
      onRehydrateStorage: () => (state) => {
        // Apply theme after rehydration from localStorage
        if (state) {
          const effectiveTheme = state.theme === 'system' ? getSystemTheme() : state.theme;
          applyTheme(effectiveTheme);
        }
      },
    }
  )
);