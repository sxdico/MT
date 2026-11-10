import type { Producto, Mesa, Usuario } from '@/types';

export const mockProductos: Producto[] = [
  { id: 1, nombre: 'Taco Pastor', precio: 18, categoria: 'Tacos' },
  { id: 2, nombre: 'Taco Suadero', precio: 18, categoria: 'Tacos' },
  { id: 3, nombre: 'Taco Cochinita', precio: 20, categoria: 'Tacos' },
  { id: 4, nombre: 'Taco Arrachera', precio: 25, categoria: 'Tacos' },
  { id: 5, nombre: 'Taco Campechano', precio: 22, categoria: 'Tacos' },
  { id: 6, nombre: 'Taco Lengua', precio: 25, categoria: 'Tacos' },
  { id: 7, nombre: 'Gringa de Pastor', precio: 35, categoria: 'Tacos' },
  { id: 8, nombre: 'Quesabesos', precio: 30, categoria: 'Tacos' },
  { id: 9, nombre: 'Coca 600ml', precio: 25, categoria: 'Bebidas' },
  { id: 10, nombre: 'Agua Jamaica', precio: 20, categoria: 'Bebidas' },
  { id: 11, nombre: 'Agua de Horchata', precio: 20, categoria: 'Bebidas' },
  { id: 12, nombre: 'Coca 1L', precio: 35, categoria: 'Bebidas' },
  { id: 13, nombre: 'Cerveza', precio: 30, categoria: 'Bebidas' },
  { id: 14, nombre: 'Refresco de Naranja', precio: 22, categoria: 'Bebidas' },
  { id: 15, nombre: 'Guacamole Extra', precio: 15, categoria: 'Extras' },
  { id: 16, nombre: 'Queso Extra', precio: 10, categoria: 'Extras' },
  { id: 17, nombre: 'Porción de Cebolla', precio: 8, categoria: 'Extras' },
  { id: 18, nombre: 'Porción de Cilantro', precio: 8, categoria: 'Extras' },
  { id: 19, nombre: 'Salsa Verde', precio: 5, categoria: 'Extras' },
  { id: 20, nombre: 'Salsa Roja', precio: 5, categoria: 'Extras' },
  { id: 21, nombre: 'Frijoles Charros', precio: 35, categoria: 'Extras' },
  { id: 22, nombre: 'Papas a la Francesa', precio: 40, categoria: 'Extras' },
];

export const mockMesas: Mesa[] = [
  { id: 1, numero: 1, estado: 'libre', pedidoId: null, total: 0 },
  { id: 2, numero: 2, estado: 'libre', pedidoId: null, total: 0 },
  { id: 3, numero: 3, estado: 'libre', pedidoId: null, total: 0 },
  { id: 4, numero: 4, estado: 'libre', pedidoId: null, total: 0 },
  { id: 5, numero: 5, estado: 'libre', pedidoId: null, total: 0 },
];

export const mockUsuarios: Usuario[] = [
  { id: 1, username: 'admin', password: 'admin123', nombre: 'Administrador', rol: 'admin' },
  { id: 2, username: 'cajero', password: 'cajero123', nombre: 'Cajero Juan', rol: 'cajero' },
  { id: 3, username: 'cocina', password: 'cocina123', nombre: 'Chef Pedro', rol: 'cocina' },
];
