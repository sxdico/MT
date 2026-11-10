import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  Calculator,
  LogOut,
  Menu as MenuIcon,
  X,
  Flame,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import type { Rol } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Rol[];
}

const navItems: NavItem[] = [
  { to: '/pos', label: 'POS / Caja', icon: ShoppingCart, roles: ['admin', 'cajero'] },
  { to: '/cocina', label: 'Cocina (KDS)', icon: ChefHat, roles: ['admin', 'cocina'] },
  { to: '/corte', label: 'Corte de Caja', icon: Calculator, roles: ['admin'] },
  { to: '/admin', label: 'Panel Admin', icon: LayoutDashboard, roles: ['admin'] },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(typeof window !== 'undefined' && window.innerWidth < 1024);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const visibleItems = navItems.filter((item) => user && item.roles.includes(user.rol));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-dvh z-40 bg-dark-800 border-r border-dark-600 transition-all duration-300 flex flex-col ${
          collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-64'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-dark-600 h-16 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/30">
            <Flame className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-white text-sm leading-tight whitespace-nowrap">Taquería POS</h1>
              <p className="text-primary-400 text-xs font-medium">Pro</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto lg:hidden text-dark-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (window.innerWidth < 1024) setCollapsed(true);
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                    : 'text-dark-300 hover:bg-dark-600 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-3 border-t border-dark-600 shrink-0">
          <div className={`flex items-center gap-3 mb-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-dark-600 flex items-center justify-center text-primary-400 font-bold text-sm shrink-0">
              {user?.nombre.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-white text-sm font-medium truncate">{user?.nombre}</p>
                <p className="text-dark-400 text-xs capitalize">{user?.rol}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-dark-300 hover:bg-error-500/10 hover:text-error-400 transition-all duration-200 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setCollapsed(false)}
        className={`fixed top-4 left-4 z-30 lg:hidden bg-dark-700 text-white p-2 rounded-lg border border-dark-600 ${
          collapsed ? 'block' : 'hidden'
        }`}
      >
        <MenuIcon className="w-5 h-5" />
      </button>
    </>
  );
}
