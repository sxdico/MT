export type Rol = 'admin' | 'cajero' | 'cocina';

export type TipoServicio = 'Mesa' | 'Para llevar' | 'Comer en coche' | 'Domicilio';

export type EstadoPedido = 'nuevo' | 'preparando' | 'listo' | 'entregado' | 'cancelado';

export type MetodoPago = 'efectivo' | 'tarjeta';

export interface Usuario {
  id: number;
  username: string;
  password: string;
  nombre: string;
  rol: Rol;
}

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: 'Tacos' | 'Bebidas' | 'Extras';
}

export interface Mesa {
  id: number;
  numero: number;
  estado: 'libre' | 'ocupada';
  pedidoId: number | null;
  total: number;
}

export interface ItemTicket {
  id: string;
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
  notas: string;
}

export interface Pedido {
  id: number;
  tipoServicio: TipoServicio;
  mesaNumero: number | null;
  clienteNombre: string;
  items: ItemTicket[];
  total: number;
  estado: EstadoPedido;
  metodoPago: MetodoPago | null;
  efectivoRecibido: number | null;
  cambio: number | null;
  cajero: string;
  createdAt: string;
  createdAtTs: number;
  updatedAt: number;
  entregadoAt: number | null;
}

export interface CorteCaja {
  id: number;
  fecha: string;
  usuario: string;
  fondoInicial: number;
  ventasTotales: number;
  ventasEfectivo: number;
  ventasTarjeta: number;
  totalContado: number;
  diferencia: number;
  numPedidos: number;
  denominaciones: Record<string, number>;
}
