import { useState, useEffect } from 'react';
import { Building2, CreditCard, Hash, Key, Check, Loader2, AlertCircle } from 'lucide-react';
import { adminAPI } from '@/services/api';

export function Financial() {
  const [formData, setFormData] = useState({
    bank: '',
    agency: '',
    account: '',
    accountType: 'Conta Corrente',
    pixKey: ''
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await adminAPI.getConfig();
        if (config.financial_data) {
          setFormData({
            bank: config.financial_data.bank || '',
            agency: config.financial_data.agency || '',
            account: config.financial_data.account || '',
            accountType: config.financial_data.accountType || 'Conta Corrente',
            pixKey: config.financial_data.pixKey || ''
          });
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminAPI.updateConfig({
        financial_data: formData
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setError(err.response?.data?.detail || 'Erro ao salvar dados');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.bank) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dados Financeiros</h1>
        <p className="text-gray-600 mt-1">
          Configure suas informações de recebimento
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl">
        {/* Alerta informativo sobre PIX */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <Key className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-blue-900 font-semibold mb-1">
              Chave PIX para Pagamentos
            </p>
            <p className="text-sm text-blue-700">
              A chave PIX cadastrada aqui será utilizada para gerar os códigos de pagamento dos clientes. Certifique-se de inserir uma chave válida e ativa.
            </p>
          </div>
        </div>

        {saved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-green-700 font-semibold">
              Dados salvos com sucesso!
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2">
              <Building2 className="w-4 h-4 inline mr-2" />
              Banco
            </label>
            <input
              type="text"
              required
              value={formData.bank}
              onChange={(e) =>
                setFormData({ ...formData, bank: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">
                <Hash className="w-4 h-4 inline mr-2" />
                Agência
              </label>
              <input
                type="text"
                required
                value={formData.agency}
                onChange={(e) =>
                  setFormData({ ...formData, agency: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                <Hash className="w-4 h-4 inline mr-2" />
                Conta
              </label>
              <input
                type="text"
                required
                value={formData.account}
                onChange={(e) =>
                  setFormData({ ...formData, account: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              <CreditCard className="w-4 h-4 inline mr-2" />
              Tipo de Conta
            </label>
            <select
              required
              value={formData.accountType}
              onChange={(e) =>
                setFormData({ ...formData, accountType: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Conta Corrente">Conta Corrente</option>
              <option value="Conta Poupança">Conta Poupança</option>
              <option value="Conta Pagamento">Conta Pagamento</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">
              <Key className="w-4 h-4 inline mr-2" />
              Chave PIX *
            </label>
            <input
              type="text"
              required
              value={formData.pixKey}
              onChange={(e) =>
                setFormData({ ...formData, pixKey: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="email@example.com, CPF/CNPJ ou chave aleatória"
            />
            <p className="text-xs text-gray-500 mt-1">
              Esta chave será usada para receber os pagamentos PIX dos clientes
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Importante:</strong> Essas informações serão usadas para processar os pagamentos recebidos. A chave PIX é obrigatória para que os clientes possam efetuar pagamentos.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-blue-700 text-white py-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  );
}
