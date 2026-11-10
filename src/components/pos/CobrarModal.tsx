import { useState } from 'react';
import type { Pedido } from '@/types';
import { X, Banknote, CreditCard, Receipt } from 'lucide-react';

interface Props {
  total: number;
  onClose: () => void;
  onConfirm: (metodo: 'efectivo' | 'tarjeta', efectivoRecibido?: number) => void;
  pedidoCobrado: Pedido | null;
}

export default function CobrarModal({ total, onClose, onConfirm, pedidoCobrado }: Props) {
  const [metodo, setMetodo] = useState<'efectivo' | 'tarjeta'>('efectivo');
  const [efectivo, setEfectivo] = useState('');
  const [cobrado, setCobrado] = useState(false);

  const efectivoNum = parseFloat(efectivo) || 0;
  const cambio = efectivoNum - total;

  const handleConfirm = () => {
    if (metodo === 'efectivo' && efectivoNum < total) return;
    onConfirm(metodo, metodo === 'efectivo' ? efectivoNum : undefined);
    setCobrado(true);
  };

  const quickAmounts = [total, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in" onClick={cobrado ? onClose : undefined}>
      <div
        className="card p-6 w-full max-w-md animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {cobrado && pedidoCobrado ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-500/20 mb-4">
              <Receipt className="w-8 h-8 text-success-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">¡Venta completada!</h3>
            <p className="text-dark-400 text-sm mb-4">Pedido #{pedidoCobrado.id}</p>
            {pedidoCobrado.cambio !== null && pedidoCobrado.cambio > 0 && (
              <div className="bg-success-500/10 rounded-lg p-4 mb-4">
                <p className="text-dark-300 text-sm">Cambio a entregar:</p>
                <p className="text-success-400 font-bold text-3xl">${pedidoCobrado.cambio.toFixed(2)}</p>
              </div>
            )}
            <button onClick={onClose} className="btn-primary w-full">
              Imprimir ticket y cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Cobrar Venta</h3>
                <p className="text-dark-400 text-sm">Selecciona método de pago</p>
              </div>
              <button onClick={onClose} className="text-dark-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total */}
            <div className="bg-dark-600 rounded-xl p-5 mb-4 text-center">
              <p className="text-dark-300 text-sm mb-1">Total a pagar</p>
              <p className="text-primary-400 font-bold text-4xl">${total.toFixed(2)}</p>
            </div>

            {/* Payment method selector */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setMetodo('efectivo')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  metodo === 'efectivo'
                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                    : 'border-dark-600 bg-dark-700 text-dark-300 hover:border-dark-500'
                }`}
              >
                <Banknote className="w-7 h-7" />
                <span className="font-medium text-sm">Efectivo</span>
              </button>
              <button
                onClick={() => setMetodo('tarjeta')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  metodo === 'tarjeta'
                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                    : 'border-dark-600 bg-dark-700 text-dark-300 hover:border-dark-500'
                }`}
              >
                <CreditCard className="w-7 h-7" />
                <span className="font-medium text-sm">Tarjeta</span>
              </button>
            </div>

            {/* Cash input */}
            {metodo === 'efectivo' && (
              <div className="space-y-3 mb-4 animate-slide-down">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Efectivo recibido</label>
                  <input
                    type="number"
                    value={efectivo}
                    onChange={(e) => setEfectivo(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="input-field w-full text-2xl font-bold text-center"
                    step="0.01"
                  />
                </div>

                {/* Quick amounts */}
                <div className="flex flex-wrap gap-2">
                  {[...new Set(quickAmounts)].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setEfectivo(amt.toFixed(2))}
                      className="px-3 py-1.5 rounded-lg bg-dark-600 hover:bg-primary-500 hover:text-white text-dark-200 text-sm font-medium transition-colors"
                    >
                      ${amt.toFixed(0)}
                    </button>
                  ))}
                </div>

                {/* Change display */}
                {efectivoNum > 0 && (
                  <div
                    className={`rounded-lg p-3 flex items-center justify-between ${
                      cambio >= 0 ? 'bg-success-500/10' : 'bg-error-500/10'
                    }`}
                  >
                    <span className="text-dark-300 text-sm">
                      {cambio >= 0 ? 'Cambio:' : 'Falta:'}
                    </span>
                    <span
                      className={`font-bold text-xl ${
                        cambio >= 0 ? 'text-success-400' : 'text-error-400'
                      }`}
                    >
                      ${Math.abs(cambio).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={metodo === 'efectivo' && efectivoNum < total}
              className="btn-success w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar cobro ${total.toFixed(2)}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
