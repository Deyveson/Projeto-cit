import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, QrCode } from 'lucide-react';
import { Voucher, orderAPI, paymentAPI } from '@/services/api';

export function Payment() {
  const navigate = useNavigate();
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit' | 'debit'>('pix');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState<string>('');
  const [cardData, setCardData] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: '',
  });

  useEffect(() => {
    const voucherData = localStorage.getItem('selectedVoucher');
    if (voucherData) {
      setSelectedVoucher(JSON.parse(voucherData));
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVoucher) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Criar o pedido com o método de pagamento
      const order = await orderAPI.create({
        voucher_id: selectedVoucher.id,
        payment_method: paymentMethod,
      });

      // 2. Processar o pagamento
      const paymentData: any = {
        order_id: order.id,
        payment_method: paymentMethod,
      };

      // Se for cartão, adiciona os dados do cartão
      if (paymentMethod === 'credit' || paymentMethod === 'debit') {
        paymentData.card_number = cardData.number.replace(/\s/g, '');
        paymentData.card_cvv = cardData.cvv;
        paymentData.card_expiry = cardData.expiry;
      }

      const payment = await paymentAPI.process(paymentData);

      // Se for PIX, guarda o QR code
      if (payment.pix_qrcode) {
        setPixCode(payment.pix_qrcode);
      }

      // Limpa o voucher selecionado e redireciona
      localStorage.removeItem('selectedVoucher');
      localStorage.setItem('lastPayment', JSON.stringify(payment));
      
      setTimeout(() => {
        navigate('/confirmacao');
      }, paymentMethod === 'pix' ? 2000 : 1000);
      
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.response?.data?.detail || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedVoucher) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/carrinho')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Pagamento</h1>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Formulário de pagamento */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                  </div>
                )}

                {/* Seleção do método */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button
                    onClick={() => setPaymentMethod('pix')}
                    disabled={loading}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'pix'
                        ? 'border-primary bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    <QrCode
                      className={`w-8 h-8 mx-auto mb-2 ${
                        paymentMethod === 'pix' ? 'text-primary' : 'text-gray-400'
                      }`}
                    />
                    <span
                      className={`font-semibold ${
                        paymentMethod === 'pix' ? 'text-primary' : 'text-gray-600'
                      }`}
                    >
                      PIX
                    </span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('credit')}
                    disabled={loading}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'credit'
                        ? 'border-primary bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    <CreditCard
                      className={`w-8 h-8 mx-auto mb-2 ${
                        paymentMethod === 'credit' ? 'text-primary' : 'text-gray-400'
                      }`}
                    />
                    <span
                      className={`font-semibold ${
                        paymentMethod === 'credit' ? 'text-primary' : 'text-gray-600'
                      }`}
                    >
                      Cartão
                    </span>
                  </button>
                </div>

                {/* PIX */}
                {paymentMethod === 'pix' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Pagamento via PIX
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <div className="bg-white p-4 rounded-lg inline-block mb-4">
                        <QrCode className="w-48 h-48 text-gray-800" />
                      </div>
                      <p className="text-gray-600 mb-2">
                        Escaneie o QR Code com o app do seu banco
                      </p>
                      <p className="text-2xl font-bold text-primary mb-4">
                        R$ {selectedVoucher.price.toFixed(2).replace('.', ',')}
                      </p>
                      {pixCode && (
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <p className="text-xs text-gray-500 mb-1">
                            Código PIX:
                          </p>
                          <p className="font-mono text-sm text-gray-700 break-all">
                            {pixCode}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-secondary hover:bg-green-600 text-white py-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Processando...' : 'Confirmar Pagamento'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Cartão */}
                {paymentMethod === 'credit' && (
                  <form onSubmit={handleSubmit}>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">
                      Dados do Cartão
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 mb-2">
                          Nome no cartão
                        </label>
                        <input
                          type="text"
                          required
                          value={cardData.name}
                          onChange={(e) =>
                            setCardData({ ...cardData, name: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="JOÃO SILVA"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 mb-2">
                          Número do cartão
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          value={cardData.number}
                          onChange={(e) =>
                            setCardData({ ...cardData, number: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="0000 0000 0000 0000"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 mb-2">
                            Validade
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={cardData.expiry}
                            onChange={(e) =>
                              setCardData({ ...cardData, expiry: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="MM/AA"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 mb-2">CVV</label>
                          <input
                            type="text"
                            required
                            maxLength={4}
                            value={cardData.cvv}
                            onChange={(e) =>
                              setCardData({ ...cardData, cvv: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="123"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-secondary hover:bg-green-600 text-white py-4 rounded-lg font-semibold transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Processando...' : 'Confirmar Pagamento'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Resumo */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Resumo
                </h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Pacote</span>
                    <span className="font-semibold">{selectedVoucher.name}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Total a pagar</span>
                    <span className="text-2xl font-bold text-primary">
                      R$ {selectedVoucher.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Pagamento seguro e protegido
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
