import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, CreditCard, Lock } from 'lucide-react';
import { authAPI, type Voucher } from '@/services/api';

export function Register() {
  const navigate = useNavigate();
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  
  useEffect(() => {
    // Buscar voucher selecionado do localStorage
    const stored = localStorage.getItem('selectedVoucher');
    if (stored) {
      setSelectedVoucher(JSON.parse(stored));
    }
  }, []);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem!');
      return;
    }
    
    if (!selectedVoucher) {
      setError('Nenhum pacote selecionado');
      return;
    }
    
    setLoading(true);
    
    try {
      // Registrar usuário na API
      await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      // Fazer login automaticamente
      await authAPI.login({
        email: formData.email,
        password: formData.password
      });
      
      // Redirecionar para carrinho/pagamento
      navigate('/carrinho');
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      setError(err.response?.data?.detail || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Formulário */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Cadastro
                </h2>
                <p className="text-gray-600 mb-8">
                  Preencha seus dados para continuar
                </p>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Nome completo
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="João Silva"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="joao@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Telefone
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="(11) 98765-4321"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      <CreditCard className="w-4 h-4 inline mr-2" />
                      CPF
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.cpf}
                      onChange={(e) =>
                        setFormData({ ...formData, cpf: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="123.456.789-00"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Senha
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Confirmar senha
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !selectedVoucher}
                    className="w-full bg-primary hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold transition-colors"
                  >
                    {loading ? 'Criando conta...' : 'Continuar'}
                  </button>
                </form>
              </div>
            </div>

            {/* Resumo do pedido */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Resumo do Pedido
                </h3>
                
                {selectedVoucher ? (
                  <div className="space-y-4">
                    <div className="pb-4 border-b border-gray-200">
                      <p className="text-gray-600 text-sm mb-1">Pacote selecionado</p>
                      <p className="font-semibold text-gray-900">
                        {selectedVoucher.name}
                      </p>
                      {selectedVoucher.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedVoucher.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="pb-4 border-b border-gray-200">
                      <p className="text-gray-600 text-sm mb-1">Horas de internet</p>
                      <p className="font-semibold text-gray-900">
                        {selectedVoucher.hours} horas
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Valor total</p>
                      <p className="text-3xl font-bold text-primary">
                        R$ {selectedVoucher.price.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      Nenhum pacote selecionado
                    </p>
                    <button
                      onClick={() => navigate('/')}
                      className="text-primary hover:text-blue-700 font-semibold"
                    >
                      Escolher pacote
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
