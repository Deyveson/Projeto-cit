import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, ArrowRight, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Confirmation() {
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const lastPayment = localStorage.getItem('lastPayment');
    if (lastPayment) {
      setPaymentData(JSON.parse(lastPayment));
      localStorage.removeItem('lastPayment');
    }

    // Verifica se o usuário está logado
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-16 h-16 text-secondary" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Pagamento Confirmado!
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              Suas horas de internet foram adicionadas com sucesso
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Clock className="w-8 h-8 text-primary" />
                <span className="text-4xl font-bold text-primary">
                  {paymentData?.hours || '3'} horas
                </span>
              </div>
              <p className="text-gray-600">
                Adicionadas à sua conta
              </p>
            </div>

            <div className="space-y-3">
              {isLoggedIn ? (
                <button
                  onClick={() => navigate('/cliente/painel')}
                  className="w-full bg-primary hover:bg-blue-700 text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  Ir para Meu Painel
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-primary hover:bg-blue-700 text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Fazer Login
                </button>
              )}

              <button
                onClick={() => {
                  const slug = localStorage.getItem('company_slug');
                  if (slug) {
                    navigate(`/loja/${slug}`);
                  } else {
                    navigate('/');
                  }
                }}
                className="w-full border-2 border-gray-200 hover:border-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
              >
                Comprar Mais
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Você receberá um e-mail de confirmação com os detalhes da sua compra
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
