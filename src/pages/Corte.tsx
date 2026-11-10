import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import {
  Calculator,
  DollarSign,
  CreditCard,
  ShoppingBag,
  Coins,
  Banknote,
  TrendingUp,
  TrendingDown,
  Save,
  History,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { useCorteStore } from '@/stores/corteStore';
import { usePosStore } from '@/stores/posStore';
import { useAuthStore } from '@/stores/authStore';
import { db } from '@/lib/db';
import type { CorteCaja } from '@/types';

const denominacionesMonedas = [
  { valor: 0.5, label: '$0.50' },
  { valor: 1, label: '$1.00' },
  { valor: 2, label: '$2.00' },
  { valor: 5, label: '$5.00' },
  { valor: 10, label: '$10.00' },
];

const denominacionesBilletes = [
  { valor: 20, label: '$20' },
  { valor: 50, label: '$50' },
  { valor: 100, label: '$100' },
  { valor: 200, label: '$200' },
  { valor: 500, label: '$500' },
  { valor: 1000, label: '$1000' },
];

export default function Corte() {
  // ✅ FIX: Destructurar en vez de traer todo el store
  const { cortes, loadCortes, crearCorte } = useCorteStore();
  const { init: initPos } = usePosStore();
  const user = useAuthStore((s) => s.user);

  const [fondoInicial, setFondoInicial] = useState('');
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [historialOpen, setHistorialOpen] = useState(false);

  // ✅ FIX: Array vacío, ya no [corteStore, posStore]
  useEffect(() => {
    loadCortes();
    initPos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calcular resumen del día
  const pedidosEntregados = db.pedidos.filter((p) => p.estado === 'entregado');
  const ventasTotales = pedidosEntregados.reduce((sum, p) => sum + p.total, 0);
  const ventasEfectivo = pedidosEntregados
    .filter((p) => p.metodoPago === 'efectivo')
    .reduce((sum, p) => sum + p.total, 0);
  const ventasTarjeta = pedidosEntregados
    .filter((p) => p.metodoPago === 'tarjeta')
    .reduce((sum, p) => sum + p.total, 0);
  const numPedidos = pedidosEntregados.length;

  // Calcular total contado físico
  const totalContado = useMemo(() => {
    let total = 0;
    for (const d of [...denominacionesMonedas, ...denominacionesBilletes]) {
      const cant = cantidades[String(d.valor)] || 0;
      total += d.valor * cant;
    }
    return total;
  }, [cantidades]);

  const fondoNum = parseFloat(fondoInicial) || 0;
  const efectivoSistema = ventasEfectivo + fondoNum;
  const diferencia = totalContado - efectivoSistema;

  const handleCantidadChange = (valor: string, cantidad: number) => {
    setCantidades((prev) => ({ ...prev, [valor]: cantidad }));
  };

  const generarPDF = (corte: CorteCaja) => {
    const pdf = new jsPDF();
    let y = 20;

    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TAQUERIA POS PRO', 105, y, { align: 'center' });
    y += 8;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Corte de Caja', 105, y, { align: 'center' });
    y += 15;

    pdf.setFontSize(10);
    pdf.text(`Fecha: ${corte.fecha}`, 20, y);
    pdf.text(`Usuario: ${corte.usuario}`, 20, y + 6);
    y += 16;

    // Resumen
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Resumen de Ventas', 20, y);
    y += 8;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total de pedidos: ${corte.numPedidos}`, 20, y); y += 6;
    pdf.text(`Ventas totales: $${corte.ventasTotales.toFixed(2)}`, 20, y); y += 6;
    pdf.text(`Ventas en efectivo: $${corte.ventasEfectivo.toFixed(2)}`, 20, y); y += 6;
    pdf.text(`Ventas con tarjeta: $${corte.ventasTarjeta.toFixed(2)}`, 20, y); y += 12;

    // Efectivo
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Conteo de Efectivo', 20, y);
    y += 8;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    pdf.text('Monedas:', 20, y); y += 6;
    for (const d of denominacionesMonedas) {
      const cant = corte.denominaciones[String(d.valor)] || 0;
      if (cant > 0) {
        pdf.text(`  ${d.label} x ${cant} = $${(d.valor * cant).toFixed(2)}`, 25, y);
        y += 5;
      }
    }

    pdf.text('Billetes:', 20, y); y += 6;
    for (const d of denominacionesBilletes) {
      const cant = corte.denominaciones[String(d.valor)] || 0;
      if (cant > 0) {
        pdf.text(`  ${d.label} x ${cant} = $${(d.valor * cant).toFixed(2)}`, 25, y);
        y += 5;
      }
    }
    y += 6;

    // Fondo y diferencia
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Fondo de caja inicial: $${corte.fondoInicial.toFixed(2)}`, 20, y); y += 7;
    pdf.text(`Total contado fisico: $${corte.totalContado.toFixed(2)}`, 20, y); y += 7;
    pdf.text(`Efectivo del sistema: $${(corte.ventasEfectivo + corte.fondoInicial).toFixed(2)}`, 20, y); y += 7;

    const diffColor = corte.diferencia === 0 ? [0, 128, 0] : [220, 38, 38];
    pdf.setTextColor(diffColor[0], diffColor[1], diffColor[2]);
    pdf.text(`Diferencia: $${corte.diferencia.toFixed(2)}`, 20, y);
    pdf.setTextColor(0, 0, 0);
    y += 12;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Documento generado por Taqueria POS Pro', 105, y, { align: 'center' });

    pdf.save(`corte_${corte.fecha.replace(/[/:]/g, '-')}.pdf`);
  };

  const handleCerrarCorte = () => {
    if (totalContado === 0 && numPedidos > 0) {
      if (!confirm('No has contado efectivo. ¿Deseas cerrar el corte con $0?')) return;
    }

    const ahora = new Date();
    const corte = crearCorte({
      fecha: ahora.toLocaleString('es-MX'),
      usuario: user?.nombre || 'Admin',
      fondoInicial: fondoNum,
      ventasTotales,
      ventasEfectivo,
      ventasTarjeta,
      totalContado,
      diferencia,
      numPedidos,
      denominaciones: { ...cantidades },
    });

    toast.success(`Corte #${corte.id} cerrado correctamente`);

    // Generar PDF
    setTimeout(() => generarPDF(corte), 300);

    // Limpiar form
    setCantidades({});
    setFondoInicial('');
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-primary-400" /> Corte de Caja
          </h2>
          <p className="text-dark-400">Cuadre de efectivo del día</p>
        </div>
        <button
          onClick={() => setHistorialOpen(!historialOpen)}
          className="btn-secondary flex items-center gap-2"
        >
          <History className="w-4 h-4" /> Historial
        </button>
      </div>

      {/* Resumen del día */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-5 h-5 text-primary-400" />
            <span className="text-dark-400 text-sm">Ventas Totales</span>
          </div>
          <p className="text-white font-bold text-2xl">${ventasTotales.toFixed(2)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-success-400" />
            <span className="text-dark-400 text-sm">Ventas Efectivo</span>
          </div>
          <p className="text-white font-bold text-2xl">${ventasEfectivo.toFixed(2)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <span className="text-dark-400 text-sm">Ventas Tarjeta</span>
          </div>
          <p className="text-white font-bold text-2xl">${ventasTarjeta.toFixed(2)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-5 h-5 text-primary-400" />
            <span className="text-dark-400 text-sm"># Pedidos</span>
          </div>
          <p className="text-white font-bold text-2xl">{numPedidos}</p>
        </div>
      </div>

      {/* Conteo de denominaciones + resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: denominaciones */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monedas */}
          <div className="card p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary-400" /> Monedas
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {denominacionesMonedas.map((d) => (
                <div key={d.valor} className="bg-dark-800 rounded-lg p-3 border border-dark-600">
                  <p className="text-dark-400 text-xs mb-1">{d.label}</p>
                  <input
                    type="number"
                    value={cantidades[String(d.valor)] || ''}
                    onChange={(e) => handleCantidadChange(String(d.valor), Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="input-field w-full text-center !py-1.5 text-sm"
                    min={0}
                  />
                  <p className="text-primary-400 text-xs mt-1 text-center font-medium">
                    ${((cantidades[String(d.valor)] || 0) * d.valor).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Billetes */}
          <div className="card p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-primary-400" /> Billetes
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {denominacionesBilletes.map((d) => (
                <div key={d.valor} className="bg-dark-800 rounded-lg p-3 border border-dark-600">
                  <p className="text-dark-400 text-xs mb-1">{d.label}</p>
                  <input
                    type="number"
                    value={cantidades[String(d.valor)] || ''}
                    onChange={(e) => handleCantidadChange(String(d.valor), Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="input-field w-full text-center !py-1.5 text-sm"
                    min={0}
                  />
                  <p className="text-primary-400 text-xs mt-1 text-center font-medium">
                    ${((cantidades[String(d.valor)] || 0) * d.valor).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Fondo de caja */}
          <div className="card p-5">
            <label className="block text-white font-semibold mb-3">Fondo de Caja Inicial</label>
            <div className="relative max-w-xs">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="number"
                value={fondoInicial}
                onChange={(e) => setFondoInicial(e.target.value)}
                placeholder="0.00"
                className="input-field w-full pl-10 text-lg font-bold"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Right: cuadre */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-4">
            <h3 className="text-white font-semibold mb-4">Cuadre de Caja</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-dark-600">
                <span className="text-dark-300 text-sm">Total contado físico:</span>
                <span className="text-white font-bold text-lg">${totalContado.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-dark-600">
                <span className="text-dark-300 text-sm">Efectivo del sistema:</span>
                <span className="text-white font-bold text-lg">${efectivoSistema.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-dark-600 text-xs">
                <span className="text-dark-400">+ Ventas efectivo:</span>
                <span className="text-dark-300">${ventasEfectivo.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-dark-600 text-xs">
                <span className="text-dark-400">+ Fondo inicial:</span>
                <span className="text-dark-300">${fondoNum.toFixed(2)}</span>
              </div>

              {/* Diferencia */}
              <div
                className={`rounded-xl p-4 ${
                  diferencia === 0
                    ? 'bg-success-500/10'
                    : diferencia > 0
                    ? 'bg-blue-500/10'
                    : 'bg-error-500/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-dark-300 text-sm flex items-center gap-1.5">
                    {diferencia === 0 ? (
                      <Calculator className="w-4 h-4 text-success-400" />
                    ) : diferencia > 0 ? (
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-error-400" />
                    )}
                    Diferencia:
                  </span>
                  <span
                    className={`font-bold text-2xl ${
                      diferencia === 0
                        ? 'text-success-400'
                        : diferencia > 0
                        ? 'text-blue-400'
                        : 'text-error-400'
                    }`}
                  >
                    {diferencia >= 0 ? '+' : ''}${diferencia.toFixed(2)}
                  </span>
                </div>
                <p className="text-dark-400 text-xs">
                  {diferencia === 0
                    ? 'Cuadre exacto'
                    : diferencia > 0
                    ? 'Sobrante en caja'
                    : 'Faltante en caja'}
                </p>
              </div>
            </div>

            <button
              onClick={handleCerrarCorte}
              className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" /> Cerrar Corte
            </button>
          </div>
        </div>
      </div>

      {/* Historial */}
      {historialOpen && (
        <div className="mt-6 card p-5 animate-slide-up">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-primary-400" /> Historial de Cortes
          </h3>
          {cortes.length === 0 ? (
            <p className="text-dark-400 text-sm py-4 text-center">No hay cortes registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-600 text-dark-400">
                    <th className="text-left py-2 px-3">#</th>
                    <th className="text-left py-2 px-3">Fecha</th>
                    <th className="text-left py-2 px-3">Usuario</th>
                    <th className="text-right py-2 px-3">Ventas</th>
                    <th className="text-right py-2 px-3">Contado</th>
                    <th className="text-right py-2 px-3">Diferencia</th>
                    <th className="text-center py-2 px-3">Pedidos</th>
                    <th className="text-center py-2 px-3">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {[...cortes].reverse().map((c) => (
                    <tr key={c.id} className="border-b border-dark-700 hover:bg-dark-700 transition-colors">
                      <td className="py-2 px-3 text-primary-400 font-bold">#{c.id}</td>
                      <td className="py-2 px-3 text-dark-200">{c.fecha}</td>
                      <td className="py-2 px-3 text-dark-300">{c.usuario}</td>
                      <td className="py-2 px-3 text-right text-white font-medium">${c.ventasTotales.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-white font-medium">${c.totalContado.toFixed(2)}</td>
                      <td
                        className={`py-2 px-3 text-right font-bold ${
                          c.diferencia === 0 ? 'text-success-400' : c.diferencia > 0 ? 'text-blue-400' : 'text-error-400'
                        }`}
                      >
                        {c.diferencia >= 0 ? '+' : ''}${c.diferencia.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center text-dark-300">{c.numPedidos}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => generarPDF(c)}
                          className="text-primary-400 hover:text-primary-300 transition-colors text-xs font-medium"
                        >
                          Descargar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}