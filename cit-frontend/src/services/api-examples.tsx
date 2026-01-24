// Exemplo de uso da API no frontend React
// Este arquivo mostra como usar o serviço de API criado

import { useState, useEffect } from 'react';
import {
  authAPI,
  voucherAPI,
  orderAPI,
  paymentAPI,
  dashboardAPI,
  type Voucher,
  type Order,
  type User
} from '@/services/api';

// =============================================================================
// EXEMPLO 1: Hook de Autenticação
// =============================================================================

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      if (authAPI.isAuthenticated()) {
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
        } catch (err) {
          console.error('Erro ao carregar usuário:', err);
          authAPI.logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      await authAPI.login({ email, password });
      const userData = await authAPI.getMe();
      setUser(userData);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao fazer login');
      return false;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setError(null);
      await authAPI.register({ name, email, password });
      return await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao registrar');
      return false;
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  return { user, loading, error, login, register, logout };
}

// =============================================================================
// EXEMPLO 2: Componente de Login
// =============================================================================

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      window.location.href = '/client/panel';
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Entrar</button>
    </form>
  );
}

// =============================================================================
// EXEMPLO 3: Listar Vouchers
// =============================================================================

export function VoucherList() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const data = await voucherAPI.getAll();
        setVouchers(data);
      } catch (err) {
        setError('Erro ao carregar vouchers');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="voucher-grid">
      {vouchers.map((voucher) => (
        <div key={voucher.id} className="voucher-card">
          <h3>{voucher.name}</h3>
          <p>{voucher.hours} horas</p>
          <p>R$ {voucher.price.toFixed(2)}</p>
          {voucher.description && <p>{voucher.description}</p>}
          <button onClick={() => handlePurchase(voucher)}>
            Comprar
          </button>
        </div>
      ))}
    </div>
  );

  async function handlePurchase(voucher: Voucher) {
    // Ver exemplo 4 abaixo
  }
}

// =============================================================================
// EXEMPLO 4: Fluxo Completo de Compra
// =============================================================================

export function PurchaseFlow() {
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit' | 'debit'>('pix');
  const [processing, setProcessing] = useState(false);

  // Passo 1: Selecionar voucher
  const selectVoucher = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
  };

  // Passo 2: Criar pedido
  const createOrder = async () => {
    if (!selectedVoucher) return;

    try {
      setProcessing(true);
      const newOrder = await orderAPI.create({
        voucher_id: selectedVoucher.id,
        payment_method: paymentMethod
      });
      setOrder(newOrder);
      return newOrder;
    } catch (err) {
      console.error('Erro ao criar pedido:', err);
      alert('Erro ao criar pedido');
    } finally {
      setProcessing(false);
    }
  };

  // Passo 3: Processar pagamento PIX
  const processPixPayment = async (orderId: string) => {
    try {
      setProcessing(true);
      const payment = await paymentAPI.process({
        order_id: orderId,
        payment_method: 'pix'
      });

      // Mostrar QR Code
      alert(`QR Code PIX: ${payment.pix_qrcode}`);
      // Aqui você pode renderizar o QR Code usando uma biblioteca

      return payment;
    } catch (err) {
      console.error('Erro no pagamento:', err);
      alert('Erro ao processar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  // Passo 3: Processar pagamento com cartão
  const processCardPayment = async (orderId: string, cardData: any) => {
    try {
      setProcessing(true);
      const payment = await paymentAPI.process({
        order_id: orderId,
        payment_method: paymentMethod,
        card_number: cardData.number,
        card_cvv: cardData.cvv,
        card_expiry: cardData.expiry
      });

      if (payment.status === 'confirmed') {
        alert('Pagamento aprovado! Horas adicionadas ao seu saldo.');
        window.location.href = '/client/panel';
      }

      return payment;
    } catch (err) {
      console.error('Erro no pagamento:', err);
      alert('Erro ao processar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  // Passo 4: Confirmar pagamento PIX (simulação)
  const confirmPixPayment = async (orderId: string) => {
    try {
      setProcessing(true);
      const result = await paymentAPI.confirm(orderId);
      alert(`Pagamento confirmado! ${result.hours_added} horas adicionadas.`);
      window.location.href = '/client/panel';
    } catch (err) {
      console.error('Erro ao confirmar:', err);
      alert('Erro ao confirmar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      {/* Renderizar UI baseado no estado */}
      {!selectedVoucher && <VoucherList />}
      {selectedVoucher && !order && (
        <PaymentMethodSelector
          onSelect={setPaymentMethod}
          onConfirm={createOrder}
        />
      )}
      {order && paymentMethod === 'pix' && (
        <PixPayment
          order={order}
          onProcess={() => processPixPayment(order.id)}
          onConfirm={() => confirmPixPayment(order.id)}
        />
      )}
      {order && (paymentMethod === 'credit' || paymentMethod === 'debit') && (
        <CardPayment
          order={order}
          onProcess={(cardData) => processCardPayment(order.id, cardData)}
        />
      )}
    </div>
  );
}

// =============================================================================
// EXEMPLO 5: Dashboard do Cliente
// =============================================================================

export function ClientDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await dashboardAPI.getClientDashboard();
        setDashboardData(data);

        const ordersData = await orderAPI.getMyOrders();
        setOrders(ordersData);
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      }
    };

    fetchDashboard();
  }, []);

  if (!dashboardData) return <div>Carregando...</div>;

  return (
    <div className="dashboard">
      <h1>Bem-vindo, {user?.name}!</h1>

      <div className="stats">
        <div className="stat-card">
          <h3>Saldo de Horas</h3>
          <p className="big-number">{dashboardData.hours_balance}h</p>
        </div>

        <div className="stat-card">
          <h3>Total Gasto</h3>
          <p className="big-number">R$ {dashboardData.total_spent.toFixed(2)}</p>
        </div>

        <div className="stat-card">
          <h3>Pedidos</h3>
          <p className="big-number">{dashboardData.total_orders}</p>
        </div>

        <div className="stat-card">
          <h3>Pedidos Pagos</h3>
          <p className="big-number">{dashboardData.paid_orders}</p>
        </div>
      </div>

      <div className="recent-orders">
        <h2>Pedidos Recentes</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Horas</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>{order.voucher_hours}h</td>
                <td>R$ {order.total_amount.toFixed(2)}</td>
                <td>
                  <span className={`status status-${order.status}`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// EXEMPLO 6: Rota Protegida
// =============================================================================

import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/client/panel" replace />;
  }

  return <>{children}</>;
}

// =============================================================================
// EXEMPLO 7: Dashboard Admin
// =============================================================================

import { adminAPI } from '@/services/api';

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsData, ordersData, usersData] = await Promise.all([
          dashboardAPI.getAdminDashboard(),
          orderAPI.getAllOrders(),
          adminAPI.getAllUsers()
        ]);

        setStats(statsData);
        setOrders(ordersData);
        setUsers(usersData);
      } catch (err) {
        console.error('Erro ao carregar dados admin:', err);
      }
    };

    fetchAdminData();
  }, []);

  if (!stats) return <div>Carregando...</div>;

  return (
    <div className="admin-dashboard">
      <h1>Dashboard Administrativo</h1>

      <div className="admin-stats">
        <div className="stat">
          <h3>Total de Usuários</h3>
          <p>{stats.total_users}</p>
        </div>

        <div className="stat">
          <h3>Pedidos Pagos</h3>
          <p>{stats.paid_orders}</p>
        </div>

        <div className="stat">
          <h3>Pedidos Pendentes</h3>
          <p>{stats.pending_orders}</p>
        </div>

        <div className="stat">
          <h3>Receita Total</h3>
          <p>R$ {stats.total_revenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabelas de pedidos e usuários */}
    </div>
  );
}

// =============================================================================
// EXEMPLO 8: Tratamento de Erros
// =============================================================================

import axios from 'axios';

export function handleApiError(error: any) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Erro da API
      const message = error.response.data.detail || 'Erro ao processar requisição';
      return message;
    } else if (error.request) {
      // Sem resposta do servidor
      return 'Servidor não está respondendo. Verifique sua conexão.';
    }
  }
  return 'Erro desconhecido';
}

// Uso:
// try {
//   await authAPI.login(credentials);
// } catch (error) {
//   const message = handleApiError(error);
//   alert(message);
// }
