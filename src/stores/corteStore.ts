import { create } from 'zustand';
import type { CorteCaja } from '@/types';
import { db } from '@/lib/db';

interface CorteState {
  cortes: CorteCaja[];
  initialized: boolean;
  crearCorte: (data: Omit<CorteCaja, 'id'>) => CorteCaja;
  loadCortes: () => void;
  cleanup: () => void;
}

export const useCorteStore = create<CorteState>((set, get) => ({
  cortes: [],
  initialized: false,

  loadCortes: () => {
    // ✅ GUARD: Si ya cargó, no vuelvas a hacer set
    if (get().initialized) {
      // Pero sí refresca si db cambió (por si se creó un corte en otra pestaña)
      set({ cortes: [...db.cortes] });
      return;
    }
    set({ initialized: true, cortes: [...db.cortes] });
  },

  crearCorte: (data) => {
    const corte: CorteCaja = { ...data, id: db.nextCorteId++ };
    db.cortes.push(corte);
    set({ cortes: [...db.cortes] });
    return corte;
  },

  cleanup: () => {
    set({ initialized: false });
  },
}));