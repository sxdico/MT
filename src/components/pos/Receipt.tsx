import type { Pedido } from '@/types';

interface Props {
  pedido: Pedido;
}

export default function Receipt({ pedido }: Props) {
  const fecha = new Date(pedido.createdAtTs).toLocaleDateString('es-MX');
  const fechaHora = new Date(pedido.createdAtTs).toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="print-receipt hidden">
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>TAQUERIA POS PRO</div>
        <div style={{ fontSize: '10px' }}>Sistema de Gestion</div>
        <div style={{ fontSize: '10px' }}>{fechaHora}</div>
      </div>

      <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', marginBottom: '8px' }}>
        <div>Ticket #{pedido.id}</div>
        <div>Servicio: {pedido.tipoServicio}</div>
        {pedido.mesaNumero && <div>Mesa: {pedido.mesaNumero}</div>}
        {pedido.clienteNombre && <div>Cliente: {pedido.clienteNombre}</div>}
        <div>Cajero: {pedido.cajero}</div>
      </div>

      <table style={{ width: '100%', fontSize: '11px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th style={{ textAlign: 'left' }}>Cant</th>
            <th style={{ textAlign: 'left' }}>Producto</th>
            <th style={{ textAlign: 'right' }}>Importe</th>
          </tr>
        </thead>
        <tbody>
          {pedido.items.map((item, i) => (
            <tr key={i}>
              <td style={{ verticalAlign: 'top' }}>{item.cantidad}</td>
              <td style={{ verticalAlign: 'top' }}>
                {item.nombre}
                {item.notas && (
                  <div style={{ fontSize: '9px', fontStyle: 'italic' }}>
                    {item.notas}
                  </div>
                )}
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                ${(item.precio * item.cantidad).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: '1px dashed #000', marginTop: '8px', paddingTop: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
          <span>TOTAL:</span>
          <span>${pedido.total.toFixed(2)}</span>
        </div>
        <div style={{ marginTop: '4px' }}>
          <div>Pago: {pedido.metodoPago}</div>
          {pedido.efectivoRecibido !== null && (
            <>
              <div>Recibido: ${pedido.efectivoRecibido.toFixed(2)}</div>
              {pedido.cambio !== null && <div>Cambio: ${pedido.cambio.toFixed(2)}</div>}
            </>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px' }}>
        <div>¡Gracias por su preferencia!</div>
        <div>Vuelva pronto</div>
      </div>
    </div>
  );
}
