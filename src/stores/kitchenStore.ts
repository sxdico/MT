import { create } from 'zustand';
import type { Pedido, EstadoPedido } from '@/types';
import { db } from '@/lib/db';
import { realtime } from '@/lib/realtime';

interface KitchenState {
  pedidos: Pedido[];
  init: () => void;
  moverEstado: (id: number, estado: EstadoPedido) => void;
  removePedido: (id: number) => void;
}

export const useKitchenStore = create<KitchenState>((set) => ({
  pedidos: [],

  init: () => {
    const active = db.pedidos.filter(
      (p) => p.estado === 'nuevo' || p.estado === 'preparando' || p.estado === 'listo'
    );
    set({ pedidos: active });

    realtime.on('nuevo_pedido', (data) => {
      const pedido = data as Pedido;
      set((s) => {
        if (s.pedidos.find((p) => p.id === pedido.id)) return s;
        return { pedidos: [pedido, ...s.pedidos] };
      });
    });

    realtime.on('update_pedido', (data) => {
      const pedido = data as Pedido;
      set((s) => ({
        pedidos: s.pedidos.map((p) => (p.id === pedido.id ? pedido : p)),
      }));
    });
  },

  moverEstado: (id, estado) => {
    const pedido = db.pedidos.find((p) => p.id === id);
    if (!pedido) return;
    pedido.estado = estado;
    pedido.updatedAt = Date.now();
    if (estado === 'listo') {
      pedido.entregadoAt = Date.now();
      // Auto-remove after 2 minutes
      setTimeout(() => {
        db.pedidos.find((p) => p.id === id);
        set((s) => ({ pedidos: s.pedidos.filter((p) => p.id !== id) }));
      }, 120000);
    }
    set((s) => ({
      pedidos: s.pedidos.map((p) => (p.id === id ? pedido : p)),
    }));
    realtime.emit('update_pedido', pedido);
  },

  removePedido: (id) => {
    set((s) => ({ pedidos: s.pedidos.filter((p) => p.id !== id) }));
  },
}));
