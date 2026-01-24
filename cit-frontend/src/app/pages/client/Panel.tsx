import { useNavigate } from 'react-router-dom';
import { Clock, Wifi, Activity, Monitor, LogOut, User, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { authAPI, orderAPI, Order } from '@/services/api';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  cpf?: string;
  available_hours: number;
  hours_balance: number;
  role: string;
}

export function ClientPanel() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, ordersData] = await Promise.all([
          authAPI.getMe(),
          orderAPI.getMyOrders()
        ]);
        
        setCurrentUser(userData);
        setOrders(ordersData);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados do painel');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (error || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <p className="text-red-600 mb-4">{error || 'Erro ao carregar dados'}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">CIT</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-gray-500">{currentUser.email}</p>
                </div>
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Saldo de horas */}
          <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl shadow-lg p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 mb-2">Saldo de Horas Disponíveis</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-bold">
                    {currentUser.hours_balance || 0}
                  </span>
                  <span className="text-2xl">horas</span>
                </div>
                {currentUser.hours_balance && currentUser.hours_balance > 0 ? (
                  <p className="text-blue-100 mt-4">
                    Aproveite sua internet de alta velocidade!
                  </p>
                ) : (
                  <div className="mt-4">
                    <p className="text-blue-100 mb-3">
                      Você não tem horas disponíveis
                    </p>
                    <button
                      onClick={() => navigate('/')}
                      className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                    >
                      Comprar Mais Horas
                    </button>
                  </div>
                )}
              </div>
              
              <div className="hidden md:block">
                <Clock className="w-32 h-32 text-blue-200 opacity-50" />
              </div>
            </div>
          </div>

          {/* Status e informações */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Activity className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Status da Conexão</p>
                  <p className="text-xl font-bold text-gray-900">Ativo</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">
                    Conectado desde 10:30
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Monitor className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">IP do Dispositivo</p>
                  <p className="text-xl font-bold text-gray-900 font-mono">
                    192.168.1.100
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">
                  Gateway: 192.168.1.1
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Wifi className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Velocidade</p>
                  <p className="text-xl font-bold text-gray-900">100 Mbps</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">
                  Download/Upload
                </span>
              </div>
            </div>
          </div>

          {/* Dados do cliente */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Meus Dados
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-600 text-sm mb-1">Nome</label>
                <p className="text-gray-900 font-semibold">
                  {currentUser.name || 'Não informado'}
                </p>
              </div>
              
              <div>
                <label className="block text-gray-600 text-sm mb-1">Email</label>
                <p className="text-gray-900 font-semibold">
                  {currentUser.email}
                </p>
              </div>
              
              <div>
                <label className="block text-gray-600 text-sm mb-1">Telefone</label>
                <p className="text-gray-900 font-semibold">
                  {currentUser.phone || 'Não informado'}
                </p>
              </div>
              
              <div>
                <label className="block text-gray-600 text-sm mb-1">CPF</label>
                <p className="text-gray-900 font-semibold">
                  {currentUser.cpf || 'Não informado'}
                </p>
              </div>
            </div>
          </div>

          {/* Histórico recente */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Histórico de Compras
            </h2>
            
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Nenhuma compra realizada ainda</p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
                >
                  Ver Pacotes
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-900">
                          {order.voucher_hours} hora{order.voucher_hours > 1 ? 's' : ''}
                        </p>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          order.status === 'paid' 
                            ? 'bg-green-100 text-green-700' 
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {order.status === 'paid' ? 'Pago' : order.status === 'pending' ? 'Pendente' : 'Falhou'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(order.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Método: {order.payment_method === 'pix' ? 'PIX' : order.payment_method === 'credit' ? 'Crédito' : 'Débito'}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      R$ {order.total_amount.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
