import { useState } from 'react';
import type { Producto } from '@/types';
import { X, Minus, Plus } from 'lucide-react';

interface Props {
  producto: Producto;
  onClose: () => void;
  onConfirm: (cantidad: number, notas: string) => void;
}

export default function AddProductModal({ producto, onClose, onConfirm }: Props) {
  const [cantidad, setCantidad] = useState(1);
  const [notas, setNotas] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(cantidad, notas);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in" onClick={onClose}>
      <div
        className="card p-6 w-full max-w-md animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">{producto.nombre}</h3>
            <p className="text-primary-400 font-semibold">${producto.precio} c/u</p>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Cantidad</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="w-10 h-10 rounded-lg bg-dark-600 hover:bg-dark-500 text-white flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-field flex-1 text-center text-lg font-bold"
                min={1}
              />
              <button
                type="button"
                onClick={() => setCantidad(cantidad + 1)}
                className="w-10 h-10 rounded-lg bg-dark-600 hover:bg-dark-500 text-white flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Notas <span className="text-dark-400 font-normal">(ej: sin cebolla, extra salsa)</span>
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Instrucciones especiales para cocina..."
              rows={2}
              className="input-field w-full resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-dark-600">
            <span className="text-dark-300 text-sm">Subtotal:</span>
            <span className="text-primary-400 font-bold text-lg">${producto.precio * cantidad}</span>
          </div>

          <button type="submit" className="btn-primary w-full">
            Agregar al ticket
          </button>
        </form>
      </div>
    </div>
  );
}
