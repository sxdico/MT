/**
 * In-memory data store shared across all Zustand stores.
 * Simulates the backend mock arrays.
 */
import type { Producto, Mesa, Pedido, CorteCaja, Usuario } from '@/types';
import { mockProductos, mockMesas, mockUsuarios } from '@/data/mockData';

export const db = {
  usuarios: [...mockUsuarios] as Usuario[],
  productos: [...mockProductos] as Producto[],
  mesas: [...mockMesas] as Mesa[],
  pedidos: [] as Pedido[],
  cortes: [] as CorteCaja[],
  nextPedidoId: 1,
  nextCorteId: 1,
};

export function resetDb() {
  db.usuarios = [...mockUsuarios];
  db.productos = [...mockProductos];
  db.mesas = [...mockMesas];
  db.pedidos = [];
  db.cortes = [];
  db.nextPedidoId = 1;
  db.nextCorteId = 1;
}
