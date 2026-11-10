import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario, Rol } from '@/types';
import { db } from '@/lib/db';

interface AuthState {
  user: Usuario | null;
  token: string | null;
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  hasRole: (...roles: Rol[]) => boolean;
}

// Simple JWT-like token generator (mock)
function makeToken(user: Usuario): string {
  return btoa(JSON.stringify({ id: user.id, username: user.username, rol: user.rol, ts: Date.now() }));
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: (username, password) => {
        const found = db.usuarios.find(
          (u) => u.username === username && u.password === password
        );
        if (!found) {
          return { success: false, message: 'Usuario o contraseña incorrectos' };
        }
        const token = makeToken(found);
        set({ user: found, token });
        return { success: true };
      },
      logout: () => set({ user: null, token: null }),
      hasRole: (...roles) => {
        const user = get().user;
        if (!user) return false;
        return roles.includes(user.rol);
      },
    }),
    {
      name: 'taqueria-auth',
    }
  )
);
