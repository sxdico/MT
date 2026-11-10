import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Pos from '@/pages/Pos';
import Cocina from '@/pages/Cocina';
import Corte from '@/pages/Corte';
import Admin from '@/pages/Admin';

export default function App() {
  const user = useAuthStore((s) => s.user);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#212528',
            color: '#E9ECEF',
            border: '1px solid #2B2F33',
            fontSize: '14px',
            borderRadius: '10px',
          },
          success: {
            iconTheme: { primary: '#22C55E', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#fff' },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to={user.rol === 'cocina' ? '/cocina' : '/pos'} replace /> : <Login />} />

          {/* POS */}
          <Route
            path="/pos"
            element={
              <ProtectedRoute roles={['admin', 'cajero']}>
                <Layout>
                  <Pos />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Cocina */}
          <Route
            path="/cocina"
            element={
              <ProtectedRoute roles={['admin', 'cocina']}>
                <Cocina />
              </ProtectedRoute>
            }
          />

          {/* Corte */}
          <Route
            path="/corte"
            element={
              <ProtectedRoute roles={['admin']}>
                <Layout>
                  <Corte />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <Layout>
                  <Admin />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to={user ? (user.rol === 'cocina' ? '/cocina' : '/pos') : '/login'} replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
