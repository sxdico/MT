import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  DollarSign,
  CreditCard,
  ShoppingBag,
  Users,
  TrendingUp,
  UtensilsCrossed,
  Clock,
  ChefHat,
  Receipt,
} from 'lucide-react';
import { db } from '@/lib/db';
import { usePosStore } from '@/stores/posStore';
import { useCorteStore } from '@/stores/corteStore';

export default function Admin() {
  const posStore = usePosStore();
  const corteStore = useCorteStore();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    posStore.init();
    corteStore.loadCortes();
    const timer = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(timer);
  }, [posStore, corteStore]);

  // Use tick to force re-read from db
  void tick;

  const pedidos = db.pedidos;
  const pedidosEntregados = pedidos.filter((p) => p.estado === 'entregado');
  const pedidosActivos = pedidos.filter(
    (p) => p.estado === 'nuevo' || p.estado === 'preparando' || p.estado === 'listo'
  );

  const ventasTotales = pedidosEntregados.reduce((sum, p) => sum + p.total, 0);
  const ventasEfectivo = pedidosEntregados
    .filter((p) => p.metodoPago === 'efectivo')
    .reduce((sum, p) => sum + p.total, 0);
  const ventasTarjeta = pedidosEntregados
    .filter((p) => p.metodoPago === 'tarjeta')
    .reduce((sum, p) => sum + p.total, 0);

  const mesasOcupadas = db.mesas.filter((m) => m.estado === 'ocupada').length;
  const mesasLibres = db.mesas.filter((m) => m.estado === 'libre').length;

  // Top productos
  const productoCount: Record<string, { cantidad: number; total: number }> = {};
  pedidosEntregados.forEach((p) => {
    p.items.forEach((item) => {
      if (!productoCount[item.nombre]) {
        productoCount[item.nombre] = { cantidad: 0, total: 0 };
      }
      productoCount[item.nombre].cantidad += item.cantidad;
      productoCount[item.nombre].total += item.precio * item.cantidad;
    });
  });
  const topProductos = Object.entries(productoCount)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 5);

  // Ventas por tipo de servicio
  const ventasPorTipo: Record<string, number> = {};
  pedidosEntregados.forEach((p) => {
    ventasPorTipo[p.tipoServicio] = (ventasPorTipo[p.tipoServicio] || 0) + p.total;
  });

  const stats = [
    { label: 'Ventas Totales', value: `$${ventasTotales.toFixed(2)}`, icon: DollarSign, color: 'text-primary-400', bg: 'bg-primary-500/10' },
    { label: 'Ventas Efectivo', value: `$${ventasEfectivo.toFixed(2)}`, icon: DollarSign, color: 'text-success-400', bg: 'bg-success-500/10' },
    { label: 'Ventas Tarjeta', value: `$${ventasTarjeta.toFixed(2)}`, icon: CreditCard, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Pedidos Entregados', value: pedidosEntregados.length, icon: ShoppingBag, color: 'text-primary-400', bg: 'bg-primary-500/10' },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <LayoutDashboard className="w-7 h-7 text-primary-400" /> Panel de Administración
        </h2>
        <p className="text-dark-400">Vista general del negocio en tiempo real</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-dark-400 text-sm">{stat.label}</p>
            <p className="text-white font-bold text-2xl mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mesas status */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-primary-400" /> Estado de Mesas
          </h3>
          <div className="space-y-2">
            {db.mesas.map((mesa) => (
              <div
                key={mesa.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  mesa.estado === 'libre' ? 'bg-success-500/10' : 'bg-error-500/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      mesa.estado === 'libre' ? 'bg-success-500' : 'bg-error-500'
                    }`}
                  />
                  <span className="text-white font-medium">Mesa {mesa.numero}</span>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-medium ${
                      mesa.estado === 'libre' ? 'text-success-400' : 'text-error-400'
                    }`}
                  >
                    {mesa.estado === 'libre' ? 'Libre' : `$${mesa.total.toFixed(2)}`}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-dark-600">
              <span className="text-dark-400 text-sm">Ocupadas: {mesasOcupadas} / Libres: {mesasLibres}</span>
            </div>
          </div>
        </div>

        {/* Pedidos activos */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary-400" /> Pedidos Activos
          </h3>
          {pedidosActivos.length === 0 ? (
            <p className="text-dark-400 text-sm py-4 text-center">No hay pedidos activos</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pedidosActivos.map((p) => (
                <div key={p.id} className="bg-dark-800 rounded-lg p-3 border border-dark-600">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-primary-400 font-bold text-sm">#{p.id}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.estado === 'nuevo'
                          ? 'bg-primary-500/10 text-primary-400'
                          : p.estado === 'preparando'
                          ? 'bg-warning-500/10 text-warning-400'
                          : 'bg-success-500/10 text-success-400'
                      }`}
                    >
                      {p.estado}
                    </span>
                  </div>
                  <p className="text-white text-sm">{p.mesaNumero ? `Mesa ${p.mesaNumero}` : p.clienteNombre}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-dark-400 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {p.createdAt}
                    </span>
                    <span className="text-white font-bold text-sm">${p.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top productos */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" /> Productos Más Vendidos
          </h3>
          {topProductos.length === 0 ? (
            <p className="text-dark-400 text-sm py-4 text-center">Aún no hay ventas</p>
          ) : (
            <div className="space-y-3">
              {topProductos.map(([nombre, data], i) => (
                <div key={nombre}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium">
                      <span className="text-primary-400 font-bold mr-1">{i + 1}.</span> {nombre}
                    </span>
                    <span className="text-dark-300 text-sm font-medium">{data.cantidad}x</span>
                  </div>
                  <div className="h-2 rounded-full bg-dark-800 overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${(data.cantidad / topProductos[0][1].cantidad) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ventas por tipo + recent pedidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Ventas por tipo */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary-400" /> Ventas por Tipo de Servicio
          </h3>
          {Object.keys(ventasPorTipo).length === 0 ? (
            <p className="text-dark-400 text-sm py-4 text-center">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(ventasPorTipo).map(([tipo, total]) => {
                const pct = ventasTotales > 0 ? (total / ventasTotales) * 100 : 0;
                return (
                  <div key={tipo}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium">{tipo}</span>
                      <span className="text-dark-300 text-sm">${total.toFixed(2)} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-dark-800 overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pedidos recientes */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-400" /> Pedidos Recientes
          </h3>
          {pedidosEntregados.length === 0 ? (
            <p className="text-dark-400 text-sm py-4 text-center">No hay pedidos entregados</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...pedidosEntregados].reverse().slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-dark-800 border border-dark-700"
                >
                  <div>
                    <span className="text-primary-400 font-bold text-sm">#{p.id}</span>
                    <span className="text-dark-300 text-sm ml-2">
                      {p.mesaNumero ? `Mesa ${p.mesaNumero}` : p.clienteNombre}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-bold text-sm">${p.total.toFixed(2)}</span>
                    <span className="text-dark-400 text-xs ml-2">{p.metodoPago}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Usuarios info */}
      <div className="card p-5 mt-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-400" /> Usuarios del Sistema
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {db.usuarios.map((u) => (
            <div key={u.id} className="bg-dark-800 rounded-lg p-4 border border-dark-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold">
                  {u.nombre.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{u.nombre}</p>
                  <p className="text-dark-400 text-xs capitalize">{u.rol}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
