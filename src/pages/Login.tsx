import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Flame, User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const result = login(username, password);
      setLoading(false);

      if (result.success) {
        toast.success('Bienvenido al sistema');
        const user = useAuthStore.getState().user;
        if (user?.rol === 'cocina') {
          navigate('/cocina');
        } else if (user?.rol === 'admin') {
          navigate('/pos');
        } else {
          navigate('/pos');
        }
      } else {
        toast.error(result.message || 'Error al iniciar sesión');
      }
    }, 400);
  };

  const quickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-dark-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-500 shadow-xl shadow-primary-500/30 mb-4">
            <Flame className="w-11 h-11 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Taquería POS</h1>
          <p className="text-primary-400 font-semibold text-lg">Pro</p>
        </div>

        {/* Login card */}
        <div className="card p-8 animate-slide-up">
          <h2 className="text-xl font-semibold text-white mb-1">Iniciar Sesión</h2>
          <p className="text-dark-400 text-sm mb-6">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  autoFocus
                  className="input-field w-full pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field w-full pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Entrar <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick login buttons */}
          <div className="mt-6 pt-6 border-t border-dark-600">
            <p className="text-xs text-dark-400 mb-3 text-center">Acceso rápido (demo):</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => quickLogin('admin', 'admin123')}
                className="px-2 py-2 rounded-lg bg-dark-600 hover:bg-dark-500 text-dark-200 text-xs font-medium transition-colors"
              >
                Admin
              </button>
              <button
                onClick={() => quickLogin('cajero', 'cajero123')}
                className="px-2 py-2 rounded-lg bg-dark-600 hover:bg-dark-500 text-dark-200 text-xs font-medium transition-colors"
              >
                Cajero
              </button>
              <button
                onClick={() => quickLogin('cocina', 'cocina123')}
                className="px-2 py-2 rounded-lg bg-dark-600 hover:bg-dark-500 text-dark-200 text-xs font-medium transition-colors"
              >
                Cocina
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-dark-400 text-xs mt-6">
          Taquería POS Pro &copy; 2026 — Sistema de gestión
        </p>
      </div>
    </div>
  );
}
