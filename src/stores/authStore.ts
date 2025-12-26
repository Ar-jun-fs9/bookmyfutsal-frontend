import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
}

interface FutsalAdmin {
  id: number;
  username: string;
  email: string;
  phone: string;
  futsal_name: string;
  location: string;
  city: string;
  futsal_id: number;
}

interface SuperAdmin {
  id: number;
  username: string;
  email: string;
}

type AuthUser = User | FutsalAdmin | SuperAdmin;

interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthState {
  user: User | null; // Only for registered users
  role: 'registered_user' | 'futsal_admin' | 'super_admin' | null;
  isAuthenticated: boolean;
  isVerified: boolean;
  hydrated: boolean;
  tokens: Tokens | null;
  isLoading: boolean;
  error: string | null;

  // Setters
  setUser: (user: User | null) => void;
  setRole: (role: 'registered_user' | 'futsal_admin' | 'super_admin' | null) => void;
  setVerified: (verified: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  setTokens: (tokens: Tokens | null) => void;

  // Auth actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      isAuthenticated: false,
      isVerified: false,
      hydrated: false,
      tokens: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setVerified: (verified) => set({ isVerified: verified }),
      setHydrated: (hydrated) => set({ hydrated }),
      setTokens: (tokens) => set({ tokens }),

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Login failed');
          }

          set({
            user: data.user,
            role: data.role,
            isAuthenticated: true,
            tokens: data.tokens,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => set({
        user: null,
        role: null,
        isAuthenticated: false,
        isVerified: false,
        tokens: null,
        error: null
      }),

      checkAuth: async () => {
        const { tokens } = get();
        if (!tokens) return;

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/verify`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          });

          if (response.ok) {
            const data = await response.json();
            set({
              user: data.user,
              role: data.role,
              isAuthenticated: true,
              isVerified: data.isVerified,
            });
          } else {
            // Token invalid, logout
            get().logout();
          }
        } catch (error) {
          get().logout();
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (name) => {
          const value = sessionStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);