import express from 'express';
import http from 'http';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
import type { Producto, Mesa, Pedido, CorteCaja, Usuario, EstadoPedido } from '../src/types/index.js';

const PORT = 3001;
const JWT_SECRET = 'taqueria-pos-pro-secret-2026';
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());

// ===== MOCK DATA =====
const mockUsuarios: Usuario[] = [
  { id: 1, username: 'admin', password: 'admin123', nombre: 'Administrador', rol: 'admin' },
  { id: 2, username: 'cajero', password: 'cajero123', nombre: 'Cajero Juan', rol: 'cajero' },
  { id: 3, username: 'cocina', password: 'cocina123', nombre: 'Chef Pedro', rol: 'cocina' },
];

const mockProductos: Producto[] = [
  { id: 1, nombre: 'Taco Pastor', precio: 18, categoria: 'Tacos' },
  { id: 2, nombre: 'Taco Suadero', precio: 18, categoria: 'Tacos' },
  { id: 3, nombre: 'Coca 600ml', precio: 25, categoria: 'Bebidas' },
  { id: 4, nombre: 'Agua Jamaica', precio: 20, categoria: 'Bebidas' },
];

const mockMesas: Mesa[] = [
  { id: 1, numero: 1, estado: 'libre', pedidoId: null, total: 0 },
  { id: 2, numero: 2, estado: 'libre', pedidoId: null, total: 0 },
  { id: 3, numero: 3, estado: 'libre', pedidoId: null, total: 0 },
  { id: 4, numero: 4, estado: 'libre', pedidoId: null, total: 0 },
  { id: 5, numero: 5, estado: 'libre', pedidoId: null, total: 0 },
];

const mockPedidos: Pedido[] = [];
const mockCortes: CorteCaja[] = [];
let nextPedidoId = 1;
let nextCorteId = 1;

// ===== MIDDLEWARE =====
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; rol: string };
    (req as express.Request & { user?: typeof decoded }).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

function requireRole(...roles: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as express.Request & { user?: { rol: string } }).user;
    if (!user || !roles.includes(user.rol)) {
      res.status(403).json({ error: 'Acceso denegado' });
      return;
    }
    next();
  };
}

// ===== ROUTES =====

// Auth
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = mockUsuarios.find((u) => u.username === username && u.password === password);
  if (!user) {
    res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    return;
  }
  const token = jwt.sign({ id: user.id, username: user.username, rol: user.rol }, JWT_SECRET, { expiresIn: '8h' });
  res.json({
    token,
    user: { id: user.id, username: user.username, nombre: user.nombre, rol: user.rol },
  });
});

// Productos
app.get('/api/productos', authMiddleware, (_req, res) => {
  res.json(mockProductos);
});

// Mesas
app.get('/api/mesas', authMiddleware, (_req, res) => {
  res.json(mockMesas);
});

app.patch('/api/mesas/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const mesa = mockMesas.find((m) => m.id === id);
  if (!mesa) {
    res.status(404).json({ error: 'Mesa no encontrada' });
    return;
  }
  Object.assign(mesa, req.body);
  io.emit('mesa_actualizada', mockMesas);
  res.json(mesa);
});

// Pedidos
app.get('/api/pedidos', authMiddleware, (_req, res) => {
  res.json(mockPedidos);
});

app.post('/api/pedidos', authMiddleware, (req, res) => {
  const pedido: Pedido = {
    ...req.body,
    id: nextPedidoId++,
    createdAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    createdAtTs: Date.now(),
    updatedAt: Date.now(),
    entregadoAt: null,
  };
  mockPedidos.push(pedido);

  // Update mesa if applicable
  if (pedido.tipoServicio === 'Mesa' && pedido.mesaNumero) {
    const mesa = mockMesas.find((m) => m.numero === pedido.mesaNumero);
    if (mesa) {
      mesa.estado = 'ocupada';
      mesa.pedidoId = pedido.id;
      mesa.total = pedido.total;
    }
  }

  // Emit to cocina room
  io.to('cocina').emit('nuevo_pedido', pedido);
  io.emit('mesa_actualizada', mockMesas);

  res.status(201).json(pedido);
});

app.patch('/api/pedidos/:id/estado', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const { estado } = req.body as { estado: EstadoPedido };
  const pedido = mockPedidos.find((p) => p.id === id);
  if (!pedido) {
    res.status(404).json({ error: 'Pedido no encontrado' });
    return;
  }
  pedido.estado = estado;
  pedido.updatedAt = Date.now();
  if (estado === 'listo') pedido.entregadoAt = Date.now();

  // Liberate mesa if entregado
  if (estado === 'entregado' && pedido.mesaNumero) {
    const mesa = mockMesas.find((m) => m.numero === pedido.mesaNumero);
    if (mesa) {
      mesa.estado = 'libre';
      mesa.pedidoId = null;
      mesa.total = 0;
    }
  }

  io.emit('update_pedido', pedido);
  io.emit('mesa_actualizada', mockMesas);
  res.json(pedido);
});

// Corte
app.get('/api/corte', authMiddleware, (_req, res) => {
  res.json(mockCortes);
});

app.post('/api/corte', authMiddleware, requireRole('admin'), (req, res) => {
  const corte: CorteCaja = { ...req.body, id: nextCorteId++ };
  mockCortes.push(corte);
  io.emit('corte_cerrado', corte);
  res.status(201).json(corte);
});

// ===== SOCKET.IO =====
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('join_cocina', () => {
    socket.join('cocina');
    console.log('Cliente unido a sala cocina');
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`\n🌮 Taquería POS Pro - Backend corriendo en puerto ${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log(`   Socket.io: ws://localhost:${PORT}\n`);
});
