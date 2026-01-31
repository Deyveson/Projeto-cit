import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, Users, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { dashboardAPI, orderAPI } from '@/services/api';

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, ordersData] = await Promise.all([
          dashboardAPI.getAdminDashboard(),
          orderAPI.getAllOrders(0, 100) // Busca até 100 pedidos
        ]);
        setStats(statsData);
        setAllOrders(ordersData);
        
        // Define os dados mensais vindos da API
        if (statsData.monthly_data && statsData.monthly_data.length > 0) {
          setMonthlyData(statsData.monthly_data);
        } else {
          // Se não houver dados, mostra mensagem vazia
          setMonthlyData([]);
        }
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        setError('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center text-red-600 py-8">
        {error || 'Erro ao carregar dados'}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral do seu negócio</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            <span className="text-sm text-green-600 font-semibold">+12%</span>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total de Vendas</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.total_orders}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-secondary" />
            </div>
            <span className="text-sm text-green-600 font-semibold">+18%</span>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total Arrecadado</h3>
          <p className="text-3xl font-bold text-gray-900">
            R$ {stats.total_revenue.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-green-600 font-semibold">+8%</span>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Média por Voucher</h3>
          <p className="text-3xl font-bold text-gray-900">
            R$ {stats.paid_orders > 0 ? (stats.total_revenue / stats.paid_orders).toFixed(2).replace('.', ',') : '0,00'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-green-600 font-semibold">+24%</span>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total de Usuários</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.total_users}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de vendas */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            Vendas por Mês
          </h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [value, 'Vendas']}
                />
                <Bar dataKey="vendas" fill="#0066FF" radius={[8, 8, 0, 0]} name="Vendas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <p>Nenhuma venda registrada ainda</p>
            </div>
          )}
        </div>

        {/* Gráfico de receita */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            Receita por Mês
          </h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2).replace('.', ',')}`, 'Receita']}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#00D166"
                  strokeWidth={3}
                  dot={{ fill: '#00D166', r: 6 }}
                  name="Receita"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <p>Nenhuma receita registrada ainda</p>
            </div>
          )}
        </div>
      </div>

      {/* Pedidos recentes */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">
          Todas as Compras
        </h3>
        {allOrders.length > 0 ? (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Cliente
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Pacote
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Data
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Método
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Valor
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {allOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{order.user_name || 'Desconhecido'}</p>
                        <p className="text-sm text-gray-500">{order.user_email || ''}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {order.voucher_hours} {order.voucher_hours === 1 ? 'Hora' : 'Horas'}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {order.payment_method === 'pix' ? 'PIX' : order.payment_method === 'credit' ? 'Crédito' : 'Débito'}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-gray-900">
                      R$ {order.total_amount.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {order.status === 'paid' ? 'Confirmado' : order.status === 'pending' ? 'Pendente' : 'Falhou'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Nenhuma compra encontrada</p>
        )}
      </div>
    </div>
  );
}
