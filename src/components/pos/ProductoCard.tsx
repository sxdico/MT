import type { Producto } from '@/types';

interface Props {
  producto: Producto;
  onAdd: (producto: Producto) => void;
}

export default function ProductoCard({ producto, onAdd }: Props) {
  return (
    <button
      onClick={() => onAdd(producto)}
      className="card p-4 hover:border-primary-500 hover:bg-dark-600 transition-all duration-200 group text-left active:scale-95"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-white text-sm leading-tight group-hover:text-primary-400 transition-colors">
            {producto.nombre}
          </h4>
          <p className="text-dark-400 text-xs mt-0.5 capitalize">{producto.categoria}</p>
        </div>
        <div className="shrink-0">
          <span className="text-primary-400 font-bold text-sm">${producto.precio}</span>
        </div>
      </div>
    </button>
  );
}
