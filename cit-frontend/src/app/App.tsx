import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@/app/context/AppContext';
import { AdminLayout } from '@/app/components/AdminLayout';

// Páginas públicas
import { Packages } from '@/app/pages/Packages';
import { Register } from '@/app/pages/Register';
import { Cart } from '@/app/pages/Cart';
import { Payment } from '@/app/pages/Payment';
import { Confirmation } from '@/app/pages/Confirmation';
import { Login } from '@/app/pages/Login';
import { StorePage } from '@/app/pages/Store';

// Páginas admin
import { Dashboard } from '@/app/pages/admin/Dashboard';
import { Company } from '@/app/pages/admin/Company';
import { Financial } from '@/app/pages/admin/Financial';

// Páginas cliente
import { ClientPanel } from '@/app/pages/client/Panel';

// Componente de rota protegida simplificado
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/" element={<Packages />} />
      <Route path="/loja/:slug" element={<StorePage />} />
      <Route path="/cadastro" element={<Register />} />
      <Route path="/carrinho" element={<Cart />} />
      <Route path="/pagamento" element={<Payment />} />
      <Route path="/confirmacao" element={<Confirmation />} />
      <Route path="/login" element={<Login />} />
      
      {/* Rotas admin */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/empresa"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Company />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/financeiro"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Financial />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Rotas cliente */}
      <Route
        path="/cliente/painel"
        element={
          <ProtectedRoute>
            <ClientPanel />
          </ProtectedRoute>
        }
      />
      
      {/* Rota padrão */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
