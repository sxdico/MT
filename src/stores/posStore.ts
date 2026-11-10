import { create } from 'zustand';
import type { Producto, Mesa, ItemTicket, TipoServicio, Pedido, MetodoPago, EstadoPedido } from '@/types';
import { db } from '@/lib/db';
import { realtime } from '@/lib/realtime';

interface PosState {
  productos: Producto[];
  mesas: Mesa[];
  // Current ticket being built
  tipoServicio: TipoServicio | null;
  mesaSeleccionada: number | null;
  clienteNombre: string;
  ticketItems: ItemTicket[];
  // Active draft pedidos per mesa (so we can come back to them)
  draftPedidos: Map<number, ItemTicket[]>;
  initialized: boolean;
  // Actions
  init: () => void;
  cleanup: () => void;
  setTipoServicio: (tipo: TipoServicio | null) => void;
  seleccionarMesa: (numero: number) => void;
  setClienteNombre: (nombre: string) => void;
  addItem: (producto: Producto, cantidad: number, notas: string) => void;
  updateItem: (id: string, cantidad: number, notas: string) => void;
  removeItem: (id: string) => void;
  clearTicket: () => void;
  getTicketTotal: () => number;
  enviarCocina: (cajero: string) => Pedido | null;
  cobrar: (cajero: string, metodoPago: MetodoPago, efectivoRecibido?: number) => Pedido | null;
  cancelarPedido: () => void;
  liberarMesa: (mesaNumero: number) => void;
  refreshMesas: () => void;
  getAllPedidos: () => Pedido[];
  updatePedidoEstado: (id: number, estado: EstadoPedido) => void;
}

export const usePosStore = create<PosState>((set, get) => ({
  productos: [],
  mesas: [],
  tipoServicio: null,
  mesaSeleccionada: null,
  clienteNombre: '',
  ticketItems: [],
  draftPedidos: new Map(),
  initialized: false,

  init: () => {
    // ✅ GUARD: Si ya está inicializado, no vuelvas a hacer set
    if (get().initialized) return;
    set({ initialized: true, productos: [...db.productos], mesas: [...db.mesas] });
  },

  cleanup: () => {
    set({ initialized: false });
  },

  setTipoServicio: (tipo) => {
    set({ tipoServicio: tipo, mesaSeleccionada: null, clienteNombre: '', ticketItems: [] });
  },

  seleccionarMesa: (numero) => {
    const mesa = db.mesas.find((m) => m.numero === numero);
    if (!mesa) return;
    // If occupied, load existing draft
    if (mesa.estado === 'ocupada' && mesa.pedidoId) {
      const pedido = db.pedidos.find((p) => p.id === mesa.pedidoId);
      if (pedido) {
        set({
          mesaSeleccionada: numero,
          tipoServicio: 'Mesa',
          ticketItems: [...pedido.items],
          clienteNombre: pedido.clienteNombre,
        });
        return;
      }
    }
    // Free table — check draft
    const draft = get().draftPedidos.get(numero);
    set({
      mesaSeleccionada: numero,
      tipoServicio: 'Mesa',
      ticketItems: draft ? [...draft] : [],
      clienteNombre: '',
    });
  },

  setClienteNombre: (nombre) => set({ clienteNombre: nombre }),

  addItem: (producto, cantidad, notas) => {
    const item: ItemTicket = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad,
      notas,
    };
    set((s) => ({ ticketItems: [...s.ticketItems, item] }));
  },

  updateItem: (id, cantidad, notas) => {
    set((s) => ({
      ticketItems: s.ticketItems.map((it) =>
        it.id === id ? { ...it, cantidad, notas } : it
      ),
    }));
  },

  removeItem: (id) => {
    set((s) => ({ ticketItems: s.ticketItems.filter((it) => it.id !== id) }));
  },

  clearTicket: () => {
    set({ ticketItems: [], clienteNombre: '', mesaSeleccionada: null });
  },

  getTicketTotal: () => {
    return get().ticketItems.reduce((sum, it) => sum + it.precio * it.cantidad, 0);
  },

  enviarCocina: (cajero) => {
    const state = get();
    if (state.ticketItems.length === 0) return null;

    const now = Date.now();

    // 1 mesa = 1 pedido abierto: si la mesa ya tiene un pedido activo, acumular items
    if (state.tipoServicio === 'Mesa' && state.mesaSeleccionada) {
      const mesa = db.mesas.find((m) => m.numero === state.mesaSeleccionada);
      if (mesa && mesa.pedidoId) {
        const pedidoExistente = db.pedidos.find((p) => p.id === mesa.pedidoId);
        if (pedidoExistente && (pedidoExistente.estado === 'nuevo' || pedidoExistente.estado === 'preparando' || pedidoExistente.estado === 'listo')) {
          pedidoExistente.items.push(...state.ticketItems);
          pedidoExistente.total = pedidoExistente.items.reduce((sum, it) => sum + it.precio * it.cantidad, 0);
          pedidoExistente.updatedAt = now;
          mesa.total = pedidoExistente.total;

          set({ mesas: [...db.mesas] });
          realtime.emit('update_pedido', pedidoExistente);
          realtime.emit('mesa_actualizada', db.mesas);

          set({ ticketItems: [] });

          return pedidoExistente;
        }
      }
    }

    // Mesa libre o servicio sin mesa: crear pedido nuevo
    const total = state.ticketItems.reduce((sum, it) => sum + it.precio * it.cantidad, 0);
    const id = db.nextPedidoId++;

    const pedido: Pedido = {
      id,
      tipoServicio: state.tipoServicio!,
      mesaNumero: state.mesaSeleccionada,
      clienteNombre: state.clienteNombre || (state.tipoServicio === 'Mesa' ? `Mesa ${state.mesaSeleccionada}` : 'Cliente'),
      items: [...state.ticketItems],
      total,
      estado: 'nuevo',
      metodoPago: null,
      efectivoRecibido: null,
      cambio: null,
      cajero,
      createdAt: new Date(now).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      createdAtTs: now,
      updatedAt: now,
      entregadoAt: null,
    };

    db.pedidos.push(pedido);

    // If it's a mesa, mark as occupied
    if (state.tipoServicio === 'Mesa' && state.mesaSeleccionada) {
      const mesa = db.mesas.find((m) => m.numero === state.mesaSeleccionada);
      if (mesa) {
        mesa.estado = 'ocupada';
        mesa.pedidoId = id;
        mesa.total = total;
      }
    }

    set({ mesas: [...db.mesas] });
    realtime.emit('nuevo_pedido', pedido);
    realtime.emit('mesa_actualizada', db.mesas);

    // Clear ticket but keep mesa context
    set({ ticketItems: [] });

    return pedido;
  },

  cobrar: (cajero, metodoPago, efectivoRecibido) => {
    const state = get();
    if (state.ticketItems.length === 0) return null;

    const total = state.ticketItems.reduce((sum, it) => sum + it.precio * it.cantidad, 0);

    // Check if there's already a sent pedido for this mesa
    let pedido: Pedido | undefined;
    if (state.tipoServicio === 'Mesa' && state.mesaSeleccionada) {
      const mesa = db.mesas.find((m) => m.numero === state.mesaSeleccionada);
      if (mesa && mesa.pedidoId) {
        pedido = db.pedidos.find((p) => p.id === mesa.pedidoId);
      }
    }

    if (pedido) {
      // Update existing pedido
      pedido.items = [...state.ticketItems];
      pedido.total = total;
      pedido.estado = 'entregado';
      pedido.metodoPago = metodoPago;
      pedido.efectivoRecibido = efectivoRecibido ?? null;
      pedido.cambio = efectivoRecibido ? efectivoRecibido - total : null;
      pedido.updatedAt = Date.now();
      pedido.entregadoAt = Date.now();
    } else {
      // Create new pedido and mark delivered
      const id = db.nextPedidoId++;
      const now = Date.now();
      pedido = {
        id,
        tipoServicio: state.tipoServicio!,
        mesaNumero: state.mesaSeleccionada,
        clienteNombre: state.clienteNombre || (state.tipoServicio === 'Mesa' ? `Mesa ${state.mesaSeleccionada}` : 'Cliente'),
        items: [...state.ticketItems],
        total,
        estado: 'entregado',
        metodoPago,
        efectivoRecibido: efectivoRecibido ?? null,
        cambio: efectivoRecibido ? efectivoRecibido - total : null,
        cajero,
        createdAt: new Date(now).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        createdAtTs: now,
        updatedAt: now,
        entregadoAt: now,
      };
      db.pedidos.push(pedido);
    }

    // Liberate mesa if applicable
    if (state.tipoServicio === 'Mesa' && state.mesaSeleccionada) {
      const mesa = db.mesas.find((m) => m.numero === state.mesaSeleccionada);
      if (mesa) {
        mesa.estado = 'libre';
        mesa.pedidoId = null;
        mesa.total = 0;
      }
      get().draftPedidos.delete(state.mesaSeleccionada);
    }

    set({ mesas: [...db.mesas], ticketItems: [], mesaSeleccionada: null, clienteNombre: '' });
    realtime.emit('update_pedido', pedido);
    realtime.emit('mesa_actualizada', db.mesas);

    return pedido;
  },

  cancelarPedido: () => {
    const state = get();
    if (state.tipoServicio === 'Mesa' && state.mesaSeleccionada) {
      const mesa = db.mesas.find((m) => m.numero === state.mesaSeleccionada);
      if (mesa && mesa.pedidoId) {
        // If there's an active pedido in kitchen, cancel it
        const pedido = db.pedidos.find((p) => p.id === mesa.pedidoId);
        if (pedido && (pedido.estado === 'nuevo' || pedido.estado === 'preparando')) {
          pedido.estado = 'cancelado';
          pedido.updatedAt = Date.now();
          realtime.emit('update_pedido', pedido);
        }
        mesa.estado = 'libre';
        mesa.pedidoId = null;
        mesa.total = 0;
      }
      get().draftPedidos.delete(state.mesaSeleccionada);
    }
    set({ mesas: [...db.mesas], ticketItems: [], mesaSeleccionada: null, clienteNombre: '', tipoServicio: null });
    realtime.emit('mesa_actualizada', db.mesas);
  },

  liberarMesa: (mesaNumero) => {
    const mesa = db.mesas.find((m) => m.numero === mesaNumero);
    if (mesa) {
      mesa.estado = 'libre';
      mesa.pedidoId = null;
      mesa.total = 0;
    }
    set({ mesas: [...db.mesas] });
    realtime.emit('mesa_actualizada', db.mesas);
  },

  refreshMesas: () => {
    set({ mesas: [...db.mesas] });
  },

  getAllPedidos: () => [...db.pedidos],

  updatePedidoEstado: (id, estado) => {
    const pedido = db.pedidos.find((p) => p.id === id);
    if (!pedido) return;
    pedido.estado = estado;
    pedido.updatedAt = Date.now();
    if (estado === 'listo') {
      pedido.entregadoAt = Date.now();
    }
    realtime.emit('update_pedido', pedido);
  },
}));