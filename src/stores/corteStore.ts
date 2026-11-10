import { create } from 'zustand';
import type { CorteCaja } from '@/types';
import { db } from '@/lib/db';

interface CorteState {
  cortes: CorteCaja[];
  crearCorte: (data: Omit<CorteCaja, 'id'>) => CorteCaja;
  loadCortes: () => void;
}

export const useCorteStore = create<CorteState>((set) => ({
  cortes: [],

  loadCortes: () => {
    set({ cortes: [...db.cortes] });
  },

  crearCorte: (data) => {
    const corte: CorteCaja = { ...data, id: db.nextCorteId++ };
    db.cortes.push(corte);
    set({ cortes: [...db.cortes] });
    return corte;
  },
}));
