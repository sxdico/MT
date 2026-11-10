import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  UtensilsCrossed,
  ShoppingBag,
  Car,
  Bike,
  Hash,
  Trash2,
  Send,
  DollarSign,
  Calculator,
  ArrowLeft,
  Minus,
  Plus,
  X,
  Clock,
} from 'lucide-react';
import { usePosStore } from '@/stores/posStore';
import { useAuthStore } from '@/stores/authStore';
import { realtime } from '@/lib/realtime';
import type { Producto, TipoServicio, ItemTicket, Pedido, MetodoPago } from '@/types';
import ProductoCard from '@/components/pos/ProductoCard';
import AddProductModal from '@/components/pos/AddProductModal';
import CobrarModal from '@/components/pos/CobrarModal';
import Receipt from '@/components/pos/Receipt';

type ServicioOption = {
  tipo: TipoServicio;
  label: string;
  icon: typeof UtensilsCrossed;
  color: string;
};

const servicios: ServicioOption[] = [
  { tipo: 'Mesa', label: 'Mesa', icon: UtensilsCrossed, color: 'from-primary-500 to-primary-600' },
  { tipo: 'Para llevar', label: 'Para Llevar', icon: ShoppingBag, color: 'from-blue-500 to-blue-600' },
  { tipo: 'Comer en coche', label: 'En Coche', icon: Car, color: 'from-success-500 to-success-600' },
  { tipo: 'Domicilio', label: 'Domicilio', icon: Bike, color: 'from-purple-500 to-purple-600' },
];

export default function Pos() {
  const posStore = usePosStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [vista, setVista] = useState<'inicio' | 'venta'>('inicio');
  const [categoriaActiva, setCategoriaActiva] = useState<'Tacos' | 'Bebidas' | 'Extras'>('Tacos');
  const [productoModal, setProductoModal] = useState<Producto | null>(null);
  const [cobrarModal, setCobrarModal] = useState(false);
  const [pedidoCobrado, setPedidoCobrado] = useState<Pedido | null>(null);
  const [editItem, setEditItem] = useState<ItemTicket | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const realtimeInitialized = useRef(false);

  useEffect(() => {
    posStore.init();
    if (!realtimeInitialized.current) {
      realtimeInitialized.current = true;
      realtime.on('mesa_actualizada', () => {
        posStore.refreshMesas();
      });
      realtime.on('update_pedido', () => {
        posStore.refreshMesas();
      });
    }
  }, [posStore]);

  const productosFiltrados = posStore.productos.filter((p) => p.categoria === categoriaActiva);
  const total = posStore.getTicketTotal();

  const handleSeleccionarServicio = (tipo: TipoServicio) => {
    if (tipo === 'Mesa') {
      posStore.setTipoServicio(tipo);
      setVista('inicio');
    } else {
      posStore.setTipoServicio(tipo);
      setVista('venta');
    }
  };

  const handleMesaClick = (numero: number) => {
    const mesa = posStore.mesas.find((m) => m.numero === numero);
    if (mesa?.estado === 'ocupada') {
      posStore.seleccionarMesa(numero);
      setVista('venta');
    } else {
      posStore.seleccionarMesa(numero);
      setVista('venta');
    }
  };

  const handleAddProduct = (producto: Producto) => {
    setProductoModal(producto);
  };

  const handleConfirmProduct = (cantidad: number, notas: string) => {
    if (productoModal) {
      posStore.addItem(productoModal, cantidad, notas);
      toast.success(`${cantidad}x ${productoModal.nombre} agregado`);
    }
    setProductoModal(null);
  };

  const handleEditItem = (item: ItemTicket) => {
    setEditItem(item);
    setProductoModal(posStore.productos.find((p) => p.id === item.productoId) || null);
  };

  const handleConfirmEdit = (cantidad: number, notas: string) => {
    if (editItem) {
      posStore.updateItem(editItem.id, cantidad, notas);
      toast.success('Producto actualizado');
      setEditItem(null);
    }
    setProductoModal(null);
  };

  const handleEnviarCocina = () => {
    if (posStore.ticketItems.length === 0) {
      toast.error('No hay productos en el ticket');
      return;
    }
    const pedido = posStore.enviarCocina(user?.nombre || 'Cajero');
    if (pedido) {
      toast.success(`Pedido #${pedido.id} enviado a cocina`);
    }
  };

  const handleCobrar = () => {
    if (posStore.ticketItems.length === 0) {
      toast.error('No hay productos en el ticket');
      return;
    }
    setCobrarModal(true);
  };

  const handleConfirmCobro = (metodo: MetodoPago, efectivoRecibido?: number) => {
    const pedido = posStore.cobrar(user?.nombre || 'Cajero', metodo, efectivoRecibido);
    if (pedido) {
      setPedidoCobrado(pedido);
      toast.success(`Pedido #${pedido.id} cobrado`);
      setTimeout(() => {
        setShowReceipt(true);
        setTimeout(() => {
          window.print();
          setShowReceipt(false);
        }, 200);
      }, 500);
    }
  };

  const handleCancelar = () => {
    if (posStore.ticketItems.length === 0 && !posStore.mesaSeleccionada) {
      setVista('inicio');
      return;
    }
    if (confirm('¿Cancelar el ticket actual?')) {
      posStore.cancelarPedido();
      toast.success('Ticket cancelado');
      setVista('inicio');
    }
  };

  const handleRemoveItem = (id: string) => {
    posStore.removeItem(id);
  };

  // ===== VISTA INICIO: Selección de servicio + grid de mesas =====
  if (vista === 'inicio' && posStore.tipoServicio === null) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
        <h2 className="text-2xl font-bold text-white mb-1">Punto de Venta</h2>
        <p className="text-dark-400 mb-8">Selecciona el tipo de servicio</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {servicios.map((s) => (
            <button
              key={s.tipo}
              onClick={() => handleSeleccionarServicio(s.tipo)}
              className={`group relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br ${s.color} hover:scale-105 transition-all duration-300 shadow-xl`}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
              <div className="relative z-10 flex flex-col items-center gap-3 text-white">
                <s.icon className="w-12 h-12" strokeWidth={1.5} />
                <span className="text-lg font-bold">{s.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ===== VISTA: Grid de mesas =====
  if (vista === 'inicio' && posStore.tipoServicio === 'Mesa') {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Selección de Mesa</h2>
            <p className="text-dark-400">Selecciona una mesa para comenzar</p>
          </div>
          <button
            onClick={() => { posStore.setTipoServicio(null); setVista('inicio'); }}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Cambiar servicio
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {posStore.mesas.map((mesa) => (
            <button
              key={mesa.id}
              onClick={() => handleMesaClick(mesa.numero)}
              className={`relative rounded-2xl p-6 transition-all duration-300 hover:scale-105 shadow-xl group ${
                mesa.estado === 'libre'
                  ? 'bg-success-500 hover:bg-success-600'
                  : 'bg-error-500 hover:bg-error-600'
              }`}
            >
              <div className="flex flex-col items-center gap-3 text-white">
                <UtensilsCrossed className="w-8 h-8" strokeWidth={1.5} />
                <div className="text-4xl font-bold">{mesa.numero}</div>
                <span className="text-sm font-medium uppercase tracking-wide">
                  {mesa.estado === 'libre' ? 'Libre' : 'Ocupada'}
                </span>
                {mesa.estado === 'ocupada' && (
                  <div className="bg-white/20 rounded-lg px-3 py-1 mt-1">
                    <span className="text-lg font-bold">${mesa.total.toFixed(2)}</span>
                  </div>
                )}
              </div>
              {/* Pulse ring for occupied */}
              {mesa.estado === 'ocupada' && (
                <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-white/80 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ===== VISTA: Pantalla de venta =====
  return (
    <div className="flex flex-col h-dvh animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-dark-600 bg-dark-800 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setVista('inicio');
              posStore.clearTicket();
              posStore.setTipoServicio(null);
            }}
            className="btn-secondary flex items-center gap-2 !py-2 !px-3"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Inicio</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 text-white">
            {posStore.tipoServicio === 'Mesa' && <UtensilsCrossed className="w-5 h-5 text-primary-400" />}
            {posStore.tipoServicio === 'Para llevar' && <ShoppingBag className="w-5 h-5 text-primary-400" />}
            {posStore.tipoServicio === 'Comer en coche' && <Car className="w-5 h-5 text-primary-400" />}
            {posStore.tipoServicio === 'Domicilio' && <Bike className="w-5 h-5 text-primary-400" />}
            <span className="font-semibold">{posStore.tipoServicio}</span>
            {posStore.mesaSeleccionada && (
              <span className="bg-primary-500 text-white text-sm px-2 py-0.5 rounded-md font-bold">
                Mesa {posStore.mesaSeleccionada}
              </span>
            )}
          </div>
        </div>

        {/* Floating Corte button for admin */}
        {user?.rol === 'admin' && (
          <button
            onClick={() => navigate('/corte')}
            className="btn-primary flex items-center gap-2 !py-2"
          >
            <Calculator className="w-4 h-4" /> <span className="hidden sm:inline">Corte de Caja</span>
          </button>
        )}
      </div>

      {/* Main content: products grid + ticket */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* Left: products */}
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          {/* Category tabs */}
          <div className="flex gap-2 mb-4 shrink-0">
            {(['Tacos', 'Bebidas', 'Extras'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  categoriaActiva === cat
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                    : 'bg-dark-600 text-dark-300 hover:bg-dark-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
              {productosFiltrados.map((producto) => (
                <ProductoCard key={producto.id} producto={producto} onAdd={handleAddProduct} />
              ))}
            </div>
          </div>
        </div>

        {/* Right: ticket */}
        <div className="w-full lg:w-96 xl:w-[420px] shrink-0 max-h-[50vh] lg:max-h-none border-t lg:border-t-0 lg:border-l border-dark-600 bg-dark-800 flex flex-col overflow-hidden">
          {/* Ticket header */}
          <div className="px-4 py-3 border-b border-dark-600 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Hash className="w-5 h-5 text-primary-400" /> Ticket Actual
              </h3>
              {posStore.ticketItems.length > 0 && (
                <button
                  onClick={() => posStore.clearTicket()}
                  className="text-dark-400 hover:text-error-400 transition-colors text-sm"
                >
                  Limpiar
                </button>
              )}
            </div>
            {/* Client name input for non-mesa */}
            {posStore.tipoServicio && posStore.tipoServicio !== 'Mesa' && (
              <input
                type="text"
                value={posStore.clienteNombre}
                onChange={(e) => posStore.setClienteNombre(e.target.value)}
                placeholder="Nombre del cliente..."
                className="input-field w-full !py-2 text-sm"
              />
            )}
          </div>

          {/* Ticket items */}
          <div className="flex-1 overflow-y-auto p-3">
            {posStore.ticketItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-dark-400 gap-3 py-12">
                <ShoppingBag className="w-12 h-12 opacity-30" strokeWidth={1} />
                <p className="text-sm">No hay productos agregados</p>
                <p className="text-xs">Selecciona productos del catálogo</p>
              </div>
            ) : (
              <div className="space-y-2">
                {posStore.ticketItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-dark-700 rounded-lg p-3 border border-dark-600 group cursor-pointer hover:border-primary-500 transition-all"
                    onClick={() => handleEditItem(item)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-primary-400 font-bold text-sm">{item.cantidad}x</span>
                          <span className="text-white font-medium text-sm">{item.nombre}</span>
                        </div>
                        {item.notas && (
                          <p className="text-error-400 text-xs mt-1 italic">⚠ {item.notas}</p>
                        )}
                        <p className="text-dark-400 text-xs mt-1">
                          ${item.precio.toFixed(2)} c/u · ${(item.precio * item.cantidad).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveItem(item.id);
                        }}
                        className="text-dark-400 hover:text-error-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticket footer with total + actions */}
          <div className="border-t border-dark-600 p-4 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-dark-300 text-sm">Total:</span>
              <span className="text-primary-400 font-bold text-2xl">${total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleCancelar}
                className="btn-danger flex flex-col items-center gap-1 !py-3"
              >
                <X className="w-4 h-4" />
                <span className="text-xs">Cancelar</span>
              </button>
              <button
                onClick={handleEnviarCocina}
                className="btn-secondary flex flex-col items-center gap-1 !py-3"
              >
                <Send className="w-4 h-4" />
                <span className="text-xs">Cocina</span>
              </button>
              <button
                onClick={handleCobrar}
                disabled={posStore.ticketItems.length === 0}
                className="btn-success flex flex-col items-center gap-1 !py-3 disabled:opacity-40"
              >
                <DollarSign className="w-4 h-4" />
                <span className="text-xs">Cobrar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {productoModal && (
        <AddProductModal
          producto={productoModal}
          onClose={() => {
            setProductoModal(null);
            setEditItem(null);
          }}
          onConfirm={editItem ? handleConfirmEdit : handleConfirmProduct}
        />
      )}

      {cobrarModal && (
        <CobrarModal
          total={total}
          onClose={() => {
            setCobrarModal(false);
            if (pedidoCobrado) {
              setPedidoCobrado(null);
              setVista('inicio');
              posStore.setTipoServicio(null);
            }
          }}
          onConfirm={handleConfirmCobro}
          pedidoCobrado={pedidoCobrado}
        />
      )}

      {/* Receipt for printing */}
      {showReceipt && pedidoCobrado && <Receipt pedido={pedidoCobrado} />}
    </div>
  );
}
