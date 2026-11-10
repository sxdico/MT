import { create } from 'zustand';
import type { Pedido, EstadoPedido } from '@/types';
import { db } from '@/lib/db';
import { realtime } from '@/lib/realtime';

interface KitchenState {
  pedidos: Pedido[];
  initialized: boolean;
  init: () => void;
  cleanup: () => void;
  moverEstado: (id: number, estado: EstadoPedido) => void;
  removePedido: (id: number) => void;
}

// Guardamos las funciones de desuscripción fuera del store
let unsubNuevo: (() => void) | null = null;
let unsubUpdate: (() => void) | null = null;

export const useKitchenStore = create<KitchenState>((set, get) => ({
  pedidos: [],
  initialized: false,

  init: () => {
    // ✅ Guard: si ya está inicializado, no registres otra vez
    if (get().initialized) return;
    set({ initialized: true });

    const active = db.pedidos.filter(
      (p) => p.estado === 'nuevo' || p.estado === 'preparando' || p.estado === 'listo'
    );
    set({ pedidos: active });

    // ✅ on() regresa una función para limpiar, la guardamos
    unsubNuevo = realtime.on('nuevo_pedido', (data) => {
      const pedido = data as Pedido;
      set((s) => {
        if (s.pedidos.find((p) => p.id === pedido.id)) return s;
        return { pedidos: [pedido, ...s.pedidos] };
      });
    });

    unsubUpdate = realtime.on('update_pedido', (data) => {
      const pedido = data as Pedido;
      set((s) => ({
        pedidos: s.pedidos.map((p) => (p.id === pedido.id ? pedido : p)),
      }));
    });
  },

  cleanup: () => {
    // ✅ Llamamos las funciones que nos regresó on()
    unsubNuevo?.();
    unsubUpdate?.();
    unsubNuevo = null;
    unsubUpdate = null;
    set({ initialized: false });
  },

  moverEstado: (id, estado) => {
    const pedido = db.pedidos.find((p) => p.id === id);
    if (!pedido) return;
    
    const pedidoActualizado = { ...pedido, estado, updatedAt: Date.now() };
    if (estado === 'listo') {
      pedidoActualizado.entregadoAt = Date.now();
      setTimeout(() => {
        set((s) => ({ pedidos: s.pedidos.filter((p) => p.id !== id) }));
      }, 120000);
    }
    
    const idx = db.pedidos.findIndex((p) => p.id === id);
    if (idx !== -1) db.pedidos[idx] = pedidoActualizado;
    
    set((s) => ({
      pedidos: s.pedidos.map((p) => (p.id === id ? pedidoActualizado : p)),
    }));
    realtime.emit('update_pedido', pedidoActualizado);
  },

  removePedido: (id) => {
    set((s) => ({ pedidos: s.pedidos.filter((p) => p.id !== id) }));
  },
}));