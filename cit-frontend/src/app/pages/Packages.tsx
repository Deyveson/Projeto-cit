import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, Clock, Star, Check, Loader2, AlertCircle, User, LogOut } from 'lucide-react';
import { voucherAPI, type Voucher } from '@/services/api';

export function Packages() {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);

    const fetchVouchers = async () => {
      try {
        const data = await voucherAPI.getAll();
        setVouchers(data);
      } catch (err) {
        console.error('Erro ao carregar vouchers:', err);
        setError('Erro ao carregar pacotes. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, []);

  const handleBuy = (voucher: Voucher) => {
    // Salvar voucher selecionado no localStorage para usar no próximo passo
    localStorage.setItem('selectedVoucher', JSON.stringify(voucher));
    
    // Verificar se o usuário está logado
    const token = localStorage.getItem('access_token');
    
    if (token) {
      // Se está logado, vai direto para o carrinho
      navigate('/carrinho');
    } else {
      // Se não está logado, vai para cadastro
      navigate('/cadastro');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando pacotes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header com navegação */}
      {isLoggedIn && (
        <header className="bg-white border-b border-gray-200 mb-8">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-bold text-gray-900">CIT</h1>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/cliente/painel')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <User className="w-5 h-5" />
                  Meu Painel
                </button>
                
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
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          {!isLoggedIn && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Wifi className="w-12 h-12 text-primary" />
              <h1 className="text-4xl font-bold text-gray-900">CIT</h1>
            </div>
          )}
          <p className="text-xl text-gray-600">
            Escolha seu plano de internet e navegue sem limites
          </p>
        </div>

        {/* Pacotes */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {vouchers.map((voucher, index) => (
            <div
              key={voucher.id}
              className={`relative bg-white rounded-2xl shadow-lg p-8 transition-transform hover:scale-105 ${
                index === 1 ? 'ring-4 ring-secondary' : ''
              }`}
            >
              {index === 1 && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-secondary text-white px-4 py-2 rounded-full flex items-center gap-1 shadow-lg">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-semibold">Melhor Oferta</span>
                  </div>
                </div>
              )}

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <Clock className="w-8 h-8 text-primary" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {voucher.name}
                </h3>

                <div className="mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-primary">
                      {voucher.hours}
                    </span>
                    <span className="text-xl text-gray-600">
                      hora{voucher.hours > 1 ? 's' : ''}
                    </span>
                  </div>
                  {voucher.description && (
                    <p className="mt-3 text-sm text-gray-600">
                      {voucher.description}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-gray-600 text-lg mr-1">R$</span>
                    <span className="text-4xl font-bold text-gray-900">
                      {voucher.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(voucher)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    index === 1
                      ? 'bg-secondary hover:bg-green-600 text-white'
                      : 'bg-primary hover:bg-blue-700 text-white'
                  }`}
                >
                  Comprar Agora
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Informações adicionais */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Por que escolher a CIT?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                  <Wifi className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Internet Rápida
                </h3>
                <p className="text-gray-600 text-sm">
                  Conexão estável e de alta velocidade
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                  <Check className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Sem Complicação
                </h3>
                <p className="text-gray-600 text-sm">
                  Ativação instantânea após o pagamento
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Controle Total
                </h3>
                <p className="text-gray-600 text-sm">
                  Acompanhe suas horas em tempo real
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
