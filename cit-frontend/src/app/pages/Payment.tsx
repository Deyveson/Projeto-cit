import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, QrCode as QrCodeIcon, Copy, Check, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Voucher, orderAPI, paymentAPI } from '@/services/api';

// Mapeamento de mensagens de erro do Mercado Pago para mensagens amigáveis
const getPaymentErrorMessage = (errorDetail: string): string => {
  const errorMessages: Record<string, string> = {
    'cc_rejected_other_reason': 'Pagamento não autorizado. Tente outro cartão ou método de pagamento.',
    'cc_rejected_call_for_authorize': 'Pagamento requer autorização. Entre em contato com seu banco.',
    'cc_rejected_insufficient_amount': 'Saldo insuficiente no cartão.',
    'cc_rejected_bad_filled_security_code': 'Código de segurança (CVV) inválido.',
    'cc_rejected_bad_filled_date': 'Data de validade inválida.',
    'cc_rejected_bad_filled_other': 'Dados do cartão inválidos. Verifique as informações.',
    'cc_rejected_card_disabled': 'Cartão desabilitado. Entre em contato com seu banco.',
    'cc_rejected_max_attempts': 'Limite de tentativas excedido. Tente novamente mais tarde.',
    'cc_rejected_duplicated_payment': 'Pagamento duplicado. Verifique se já não foi realizado.',
    'cc_rejected_card_type_not_allowed': 'Tipo de cartão não permitido. Tente outro cartão.',
    'cc_rejected_invalid_installments': 'Número de parcelas inválido.',
    'cc_rejected_blacklist': 'Pagamento não autorizado por motivos de segurança.',
    'pending_contingency': 'Pagamento pendente de processamento.',
    'pending_review_manual': 'Pagamento em análise.',
  };

  // Verifica se o erro contém algum dos códigos conhecidos
  for (const [code, message] of Object.entries(errorMessages)) {
    if (errorDetail.toLowerCase().includes(code.toLowerCase())) {
      return message;
    }
  }

  // Se não encontrar, retorna mensagem genérica
  if (errorDetail.toLowerCase().includes('rejected') || errorDetail.toLowerCase().includes('recusado')) {
    return 'Pagamento não autorizado. Tente outro cartão ou método de pagamento.';
  }

  return errorDetail;
};

// Declaração global para o SDK do Mercado Pago
declare global {
  interface Window {
    MercadoPago: any;
  }
}

export function Payment() {
  const navigate = useNavigate();
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit' | 'debit'>('pix');
  const [loading, setLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState<string>('');
  const [pixKey, setPixKey] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [mpReady, setMpReady] = useState(false);
  const [processingCard, setProcessingCard] = useState(false);
  const cardFormRef = useRef<any>(null);
  const [cardData, setCardData] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: '',
    cpf: '',
    email: '',
  });

  useEffect(() => {
    const voucherData = localStorage.getItem('selectedVoucher');
    if (voucherData) {
      setSelectedVoucher(JSON.parse(voucherData));
    } else {
      navigate('/');
    }
  }, [navigate]);

  // Carrega o SDK do Mercado Pago
  useEffect(() => {
    const loadMercadoPago = async () => {
      try {
        // Carrega o script do SDK se ainda não existir
        if (!document.getElementById('mercadopago-sdk')) {
          const script = document.createElement('script');
          script.id = 'mercadopago-sdk';
          script.src = 'https://sdk.mercadopago.com/js/v2';
          script.async = true;
          script.onload = async () => {
            // Busca a public key do backend
            const { public_key } = await paymentAPI.getMercadoPagoPublicKey();
            if (public_key && window.MercadoPago) {
              const mp = new window.MercadoPago(public_key, {
                locale: 'pt-BR'
              });
              cardFormRef.current = mp;
              setMpReady(true);
            }
          };
          document.body.appendChild(script);
        } else if (window.MercadoPago) {
          const { public_key } = await paymentAPI.getMercadoPagoPublicKey();
          if (public_key) {
            const mp = new window.MercadoPago(public_key, {
              locale: 'pt-BR'
            });
            cardFormRef.current = mp;
            setMpReady(true);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar Mercado Pago SDK:', err);
        // Continua sem SDK - usará modo fallback
        setMpReady(false);
      }
    };

    loadMercadoPago();
  }, []);

  const createCardToken = async (): Promise<string | null> => {
    if (!cardFormRef.current || !mpReady) {
      return null; // Fallback mode
    }

    try {
      // Separa mês e ano da validade
      const [expMonth, expYear] = cardData.expiry.split('/');
      
      // Usa o método fields do SDK v2 para criar token
      const cardTokenData = {
        cardNumber: cardData.number.replace(/\s/g, ''),
        cardholderName: cardData.name,
        cardExpirationMonth: expMonth,
        cardExpirationYear: expYear.length === 2 ? `20${expYear}` : expYear,
        securityCode: cardData.cvv,
        identificationType: 'CPF',
        identificationNumber: cardData.cpf.replace(/\D/g, ''),
      };

      // Tenta o método createCardToken do SDK
      const response = await cardFormRef.current.fields.createCardToken(cardTokenData);
      return response?.id || null;
    } catch (err: any) {
      console.error('Erro ao criar token do cartão (método 1):', err);
      
      // Tenta método alternativo
      try {
        const [expMonth, expYear] = cardData.expiry.split('/');
        
        const formData = new FormData();
        formData.append('card_number', cardData.number.replace(/\s/g, ''));
        formData.append('cardholder[name]', cardData.name);
        formData.append('card_expiration_month', expMonth);
        formData.append('card_expiration_year', expYear.length === 2 ? `20${expYear}` : expYear);
        formData.append('security_code', cardData.cvv);
        formData.append('cardholder[identification][type]', 'CPF');
        formData.append('cardholder[identification][number]', cardData.cpf.replace(/\D/g, ''));
        
        const { public_key } = await paymentAPI.getMercadoPagoPublicKey();
        
        const response = await fetch(`https://api.mercadopago.com/v1/card_tokens?public_key=${public_key}`, {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.id;
        }
        
        console.error('Erro na API de token:', await response.text());
        return null;
      } catch (apiError) {
        console.error('Erro ao criar token do cartão (método 2):', apiError);
        return null;
      }
    }
  };

  const detectCardBrand = (number: string): string => {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'master';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6(?:011|5)/.test(cleanNumber)) return 'discover';
    if (/^(36|38|30[0-5])/.test(cleanNumber)) return 'diners';
    if (cleanNumber.startsWith('35')) return 'jcb';
    if (/^(50|6[0-9])/.test(cleanNumber)) return 'elo';
    if (/^(606282|3841)/.test(cleanNumber)) return 'hipercard';
    return 'master'; // Default
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVoucher) return;

    setLoading(true);
    setError(null);

    try {
      // Busca o slug da empresa do localStorage
      const companySlug = localStorage.getItem('company_slug') || undefined;
      
      // 1. Criar o pedido com o método de pagamento e slug da empresa
      const order = await orderAPI.create({
        voucher_id: selectedVoucher.id,
        payment_method: paymentMethod,
        company_slug: companySlug,
      });

      // 2. Processar o pagamento
      const paymentData: any = {
        order_id: order.id,
        payment_method: paymentMethod,
      };

      // Se for cartão, tenta criar token via Mercado Pago
      if (paymentMethod === 'credit' || paymentMethod === 'debit') {
        // Valida campos obrigatórios
        if (!cardData.name || !cardData.number || !cardData.expiry || !cardData.cvv) {
          throw new Error('Preencha todos os dados do cartão');
        }

        if (mpReady && cardData.cpf && cardData.email) {
          // Tenta usar o SDK do Mercado Pago
          try {
            setProcessingCard(true);
            const token = await createCardToken();
            setProcessingCard(false);
            
            if (token) {
              paymentData.card_token = token;
              paymentData.card_payment_method_id = detectCardBrand(cardData.number);
              paymentData.card_installments = 1;
              paymentData.payer_email = cardData.email;
              paymentData.card_holder_name = cardData.name;
              paymentData.identification_type = 'CPF';
              paymentData.identification_number = cardData.cpf.replace(/\D/g, '');
            } else {
              // Fallback para modo simulação
              paymentData.card_number = cardData.number.replace(/\s/g, '');
              paymentData.card_cvv = cardData.cvv;
              paymentData.card_expiry = cardData.expiry;
              paymentData.payer_email = cardData.email || 'cliente@email.com';
              paymentData.card_holder_name = cardData.name;
            }
          } catch (tokenError) {
            console.log('Token creation failed, using fallback mode');
            setProcessingCard(false);
            // Fallback para modo simulação
            paymentData.card_number = cardData.number.replace(/\s/g, '');
            paymentData.card_cvv = cardData.cvv;
            paymentData.card_expiry = cardData.expiry;
            paymentData.payer_email = cardData.email || 'cliente@email.com';
            paymentData.card_holder_name = cardData.name;
          }
        } else {
          // Modo simulação (sem SDK ou dados incompletos)
          paymentData.card_number = cardData.number.replace(/\s/g, '');
          paymentData.card_cvv = cardData.cvv;
          paymentData.card_expiry = cardData.expiry;
          paymentData.payer_email = cardData.email || 'cliente@email.com';
          paymentData.card_holder_name = cardData.name;
        }
      }

      const payment = await paymentAPI.process(paymentData);

      // Se for PIX, guarda o QR code e a chave
      if (payment.pix_qrcode) {
        setPixCode(payment.pix_qrcode);
        setPixKey(payment.pix_key || '');
        setOrderId(order.id);
        // Para PIX, não redireciona - usuário precisa pagar primeiro
      } else {
        // Para cartão, redireciona imediatamente pois é aprovado instantaneamente
        localStorage.removeItem('selectedVoucher');
        localStorage.setItem('lastPayment', JSON.stringify({
          ...payment,
          hours: selectedVoucher.hours,
        }));
        
        setTimeout(() => {
          navigate('/confirmacao');
        }, 1000);
      }
      
    } catch (err: any) {
      console.error('Payment error:', err);
      setProcessingCard(false);
      const rawMessage = err.response?.data?.detail || err.message || 'Erro ao processar pagamento';
      const errorMessage = getPaymentErrorMessage(rawMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!orderId) return;

    setCheckingPayment(true);
    setError(null);

    try {
      const payment = await paymentAPI.getStatus(orderId);
      
      if (payment.status === 'confirmed' || payment.status === 'paid') {
        // Pagamento confirmado! Redireciona para confirmação
        localStorage.removeItem('selectedVoucher');
        localStorage.setItem('lastPayment', JSON.stringify({
          ...payment,
          hours: selectedVoucher?.hours || 0,
        }));
        
        navigate('/confirmacao');
      } else {
        setError('Pagamento ainda não foi confirmado. Por favor, aguarde.');
      }
    } catch (err: any) {
      console.error('Error checking payment:', err);
      setError('Erro ao verificar status do pagamento');
    } finally {
      setCheckingPayment(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                    <QrCodeIcon
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
                {paymentMethod === 'pix' && !pixCode && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Pagamento via PIX
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <div className="bg-white p-4 rounded-lg inline-block mb-4">
                        <QrCodeIcon className="w-48 h-48 text-gray-800" />
                      </div>
                      <p className="text-gray-600 mb-2">
                        Clique em confirmar para gerar o código PIX
                      </p>
                      <p className="text-2xl font-bold text-primary mb-4">
                        R$ {selectedVoucher.price.toFixed(2).replace('.', ',')}
                      </p>
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-secondary hover:bg-green-600 text-white py-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? 'Gerando código PIX...' : 'Gerar Código PIX'}
                      </button>
                    </div>
                  </div>
                )}

                {/* PIX Code Gerado */}
                {paymentMethod === 'pix' && pixCode && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Pagamento via PIX
                    </h3>
                    <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-6">
                      <div className="bg-white p-6 rounded-lg mb-4">
                        <div className="text-center mb-4">
                          <div className="bg-white p-4 rounded-lg inline-block mb-3 border border-gray-200">
                            <QRCodeSVG 
                              value={pixCode} 
                              size={192}
                              level="M"
                              includeMargin={true}
                            />
                          </div>
                          <p className="text-sm text-gray-600">
                            Escaneie o QR Code acima com o app do seu banco
                          </p>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            Chave PIX:
                          </p>
                          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                            <span className="flex-1 font-mono text-sm text-gray-800 break-all">
                              {pixKey}
                            </span>
                            <button
                              onClick={() => copyToClipboard(pixKey)}
                              className="p-2 hover:bg-gray-200 rounded transition-colors"
                              title="Copiar chave PIX"
                            >
                              {copied ? (
                                <Check className="w-5 h-5 text-green-600" />
                              ) : (
                                <Copy className="w-5 h-5 text-gray-600" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 mt-4 pt-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            Código PIX Copia e Cola:
                          </p>
                          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                            <span className="flex-1 font-mono text-xs text-gray-800 break-all line-clamp-2">
                              {pixCode}
                            </span>
                            <button
                              onClick={() => copyToClipboard(pixCode)}
                              className="p-2 hover:bg-gray-200 rounded transition-colors"
                              title="Copiar código"
                            >
                              {copied ? (
                                <Check className="w-5 h-5 text-green-600" />
                              ) : (
                                <Copy className="w-5 h-5 text-gray-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 mb-4">
                        <p className="text-2xl font-bold text-primary text-center">
                          R$ {selectedVoucher.price.toFixed(2).replace('.', ',')}
                        </p>
                      </div>

                      <div className="text-center text-sm text-gray-600 space-y-1 mb-4">
                        <p>✓ Após realizar o pagamento, clique no botão abaixo para confirmar</p>
                        <p>✓ O pagamento pode levar alguns instantes para ser processado</p>
                      </div>

                      <button
                        onClick={checkPaymentStatus}
                        disabled={checkingPayment}
                        className="w-full bg-secondary hover:bg-green-600 text-white py-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {checkingPayment ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Verificando pagamento...
                          </>
                        ) : (
                          'Já paguei - Confirmar Pagamento'
                        )}
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
                            setCardData({ ...cardData, name: e.target.value.toUpperCase() })
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
                          onChange={(e) => {
                            // Formata o número do cartão com espaços
                            const value = e.target.value.replace(/\D/g, '');
                            const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                            setCardData({ ...cardData, number: formatted });
                          }}
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
                            onChange={(e) => {
                              // Formata MM/AA
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length >= 2) {
                                value = value.substring(0, 2) + '/' + value.substring(2, 4);
                              }
                              setCardData({ ...cardData, expiry: value });
                            }}
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
                              setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })
                            }
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="123"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-700 mb-2">
                          CPF do titular
                        </label>
                        <input
                          type="text"
                          required={mpReady}
                          maxLength={14}
                          value={cardData.cpf}
                          onChange={(e) => {
                            // Formata CPF
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length > 3) value = value.substring(0, 3) + '.' + value.substring(3);
                            if (value.length > 7) value = value.substring(0, 7) + '.' + value.substring(7);
                            if (value.length > 11) value = value.substring(0, 11) + '-' + value.substring(11, 13);
                            setCardData({ ...cardData, cpf: value });
                          }}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="000.000.000-00"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          required={mpReady}
                          value={cardData.email}
                          onChange={(e) =>
                            setCardData({ ...cardData, email: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="seu@email.com"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading || processingCard}
                        className="w-full bg-secondary hover:bg-green-600 text-white py-4 rounded-lg font-semibold transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading || processingCard ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {processingCard ? 'Processando cartão...' : 'Finalizando...'}
                          </>
                        ) : (
                          `Pagar R$ ${selectedVoucher.price.toFixed(2).replace('.', ',')}`
                        )}
                      </button>

                      {mpReady && (
                        <p className="text-xs text-center text-gray-500 mt-2">
                          🔒 Pagamento seguro processado pelo Mercado Pago
                        </p>
                      )}
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
