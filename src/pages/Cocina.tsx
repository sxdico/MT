import { useEffect, useState, useRef } from 'react';
import {
  ChefHat,
  Clock,
  Flame,
  CheckCircle2,
  CookingPot,
  UtensilsCrossed,
  ShoppingBag,
  Car,
  Bike,
  Bell,
} from 'lucide-react';
import { useKitchenStore } from '@/stores/kitchenStore';
import type { Pedido, TipoServicio, EstadoPedido } from '@/types';

const servicioIcon: Record<TipoServicio, typeof UtensilsCrossed> = {
  Mesa: UtensilsCrossed,
  'Para llevar': ShoppingBag,
  'Comer en coche': Car,
  Domicilio: Bike,
};

const servicioColor: Record<TipoServicio, string> = {
  Mesa: 'text-primary-400 bg-primary-500/10',
  'Para llevar': 'text-blue-400 bg-blue-500/10',
  'Comer en coche': 'text-success-400 bg-success-500/10',
  Domicilio: 'text-purple-400 bg-purple-500/10',
};

function formatoRelativo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s`;
  const min = Math.floor(diff / 60);
  const sec = diff % 60;
  return `${min}m ${sec}s`;
}

function PedidoCard({ pedido, onMover }: { pedido: Pedido; onMover: (id: number, estado: EstadoPedido) => void }) {
  const Icon = servicioIcon[pedido.tipoServicio];
  const [tiempo, setTiempo] = useState(formatoRelativo(pedido.createdAtTs));

  useEffect(() => {
    const interval = setInterval(() => setTiempo(formatoRelativo(pedido.createdAtTs)), 1000);
    return () => clearInterval(interval);
  }, [pedido.createdAtTs]);

  const isUrgente = Date.now() - pedido.createdAtTs > 600000; // 10 min

  return (
    <div
      className={`card p-4 animate-slide-up ${
        isUrgente && pedido.estado === 'nuevo' ? 'border-error-500/50 animate-pulse-ring' : ''
      }`}
    >
      {/* Card header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-primary-400 font-bold text-lg">#{pedido.id}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${servicioColor[pedido.tipoServicio]}`}>
              <Icon className="w-3 h-3 inline mr-1" />
              {pedido.tipoServicio}
            </span>
          </div>
          <p className="text-white text-sm font-medium mt-1">
            {pedido.mesaNumero ? `Mesa ${pedido.mesaNumero}` : pedido.clienteNombre}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-dark-400 text-xs">
            <Clock className="w-3 h-3" />
            <span className={isUrgente ? 'text-error-400 font-bold' : ''}>{tiempo}</span>
          </div>
          <p className="text-dark-500 text-xs mt-0.5">{pedido.createdAt}</p>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1.5 mb-3 border-t border-dark-600 pt-3">
        {pedido.items.map((item) => (
          <div key={item.id} className="text-sm">
            <div className="flex items-start justify-between gap-2">
              <span className="text-white font-medium">
                <span className="text-primary-400 font-bold">{item.cantidad}x</span> {item.nombre}
              </span>
            </div>
            {item.notas && (
              <p className="text-error-400 text-xs ml-6 italic font-medium">⚠ {item.notas}</p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-dark-600">
        {pedido.estado === 'nuevo' && (
          <button
            onClick={() => onMover(pedido.id, 'preparando')}
            className="flex-1 bg-warning-500 hover:bg-warning-600 text-white font-semibold rounded-lg py-2 flex items-center justify-center gap-1.5 transition-all duration-200 text-sm"
          >
            <CookingPot className="w-4 h-4" /> Preparar
          </button>
        )}
        {pedido.estado === 'preparando' && (
          <button
            onClick={() => onMover(pedido.id, 'listo')}
            className="flex-1 bg-success-500 hover:bg-success-600 text-white font-semibold rounded-lg py-2 flex items-center justify-center gap-1.5 transition-all duration-200 text-sm"
          >
            <CheckCircle2 className="w-4 h-4" /> Listo
          </button>
        )}
        {pedido.estado === 'listo' && (
          <div className="flex-1 text-center text-success-400 font-semibold py-2 text-sm flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Listo para entregar
          </div>
        )}
      </div>
    </div>
  );
}

export default function Cocina() {
  const kitchenStore = useKitchenStore();
  const [reloj, setReloj] = useState(new Date());
  const soundRef = useRef<HTMLAudioElement | null>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    kitchenStore.init();

    const timer = setInterval(() => setReloj(new Date()), 1000);
    return () => clearInterval(timer);
  }, [kitchenStore]);

  // Play sound when new pedidos arrive
  useEffect(() => {
    const nuevos = kitchenStore.pedidos.filter((p) => p.estado === 'nuevo');
    if (nuevos.length > prevCountRef.current) {
      playDing();
    }
    prevCountRef.current = nuevos.length;
  }, [kitchenStore.pedidos]);

  const playDing = () => {
    try {
      // Generate a beep using Web Audio API as fallback for ding.mp3
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio not supported
    }
  };

  const pedidosNuevos = kitchenStore.pedidos.filter((p) => p.estado === 'nuevo');
  const pedidosPreparando = kitchenStore.pedidos.filter((p) => p.estado === 'preparando');
  const pedidosListos = kitchenStore.pedidos.filter((p) => p.estado === 'listo');

  const pendientes = pedidosNuevos.length + pedidosPreparando.length;

  const columnas = [
    { titulo: 'NUEVOS', items: pedidosNuevos, color: 'text-primary-400', bg: 'bg-primary-500/5', count: pedidosNuevos.length },
    { titulo: 'PREPARANDO', items: pedidosPreparando, color: 'text-warning-400', bg: 'bg-warning-500/5', count: pedidosPreparando.length },
    { titulo: 'LISTOS', items: pedidosListos, color: 'text-success-400', bg: 'bg-success-500/5', count: pedidosListos.length },
  ];

  return (
    <div className="flex flex-col h-dvh">
      {/* Header */}
      <div className="bg-dark-800 border-b border-dark-600 px-4 lg:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">Cocina · KDS</h2>
            <p className="text-dark-400 text-xs">Comandera digital</p>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          {/* Pendientes counter */}
          <div className="flex items-center gap-2 bg-dark-700 rounded-lg px-4 py-2">
            <Bell className={`w-5 h-5 ${pendientes > 0 ? 'text-primary-400 animate-pulse' : 'text-dark-400'}`} />
            <div>
              <p className="text-dark-400 text-xs">Pendientes</p>
              <p className="text-white font-bold text-lg leading-none">{pendientes}</p>
            </div>
          </div>

          {/* Clock */}
          <div className="text-right">
            <p className="text-primary-400 font-bold text-2xl lg:text-3xl font-mono leading-none tabular-nums">
              {reloj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-dark-400 text-xs mt-1">
              {reloj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-hidden p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          {columnas.map((col) => (
            <div
              key={col.titulo}
              className={`flex flex-col rounded-2xl border border-dark-600 ${col.bg} overflow-hidden`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-dark-600 bg-dark-800/80 shrink-0">
                <div className="flex items-center gap-2">
                  <Flame className={`w-5 h-5 ${col.color}`} />
                  <h3 className={`font-bold text-sm tracking-wide ${col.color}`}>{col.titulo}</h3>
                </div>
                <span className={`text-2xl font-bold ${col.color} tabular-nums`}>{col.count}</span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {col.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-dark-400 gap-2 py-8">
                    <CookingPot className="w-10 h-10 opacity-20" strokeWidth={1} />
                    <p className="text-sm">Sin pedidos</p>
                  </div>
                ) : (
                  col.items.map((pedido) => (
                    <PedidoCard
                      key={pedido.id}
                      pedido={pedido}
                      onMover={kitchenStore.moverEstado}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
