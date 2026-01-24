import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Voucher, orderAPI } from '@/services/api';

export function Cart() {
  const navigate = useNavigate();
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const voucherData = localStorage.getItem('selectedVoucher');
    if (voucherData) {
      setSelectedVoucher(JSON.parse(voucherData));
    }
  }, []);

  const handleRemoveVoucher = () => {
    localStorage.removeItem('selectedVoucher');
    setSelectedVoucher(null);
  };

  const handleFinalizePurchase = () => {
    if (!selectedVoucher) return;
    // Navega para a página de pagamento onde o pedido será criado
    navigate('/pagamento');
  };

  if (!selectedVoucher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Seu carrinho está vazio
          </h2>
          <p className="text-gray-600 mb-6">
            Adicione pacotes para continuar
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Ver Pacotes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/cadastro')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Carrinho de Compras
          </h1>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Itens do carrinho */}
            <div className="md:col-span-2 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {selectedVoucher.name}
                    </h3>
                    {selectedVoucher.description && (
                      <p className="text-gray-600 mb-2">
                        {selectedVoucher.description}
                      </p>
                    )}
                    <p className="text-gray-600 mb-2">
                      {selectedVoucher.hours} hora{selectedVoucher.hours > 1 ? 's' : ''}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      R$ {selectedVoucher.price.toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  <button
                    onClick={handleRemoveVoucher}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Remover"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Quantidade:</span>
                    <span className="font-semibold">1</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                    <span>Subtotal:</span>
                    <span className="font-semibold">
                      R$ {selectedVoucher.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumo */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Resumo do Pedido
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>R$ {selectedVoucher.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-primary">
                        R$ {selectedVoucher.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleFinalizePurchase}
                  className="w-full bg-secondary hover:bg-green-600 text-white py-4 rounded-lg font-semibold transition-colors"
                >
                  Finalizar Compra
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="w-full mt-3 border-2 border-gray-200 hover:border-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
                >
                  Adicionar Mais Pacotes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
