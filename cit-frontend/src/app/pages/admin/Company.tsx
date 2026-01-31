import { useState, useEffect } from 'react';
import { Building2, Mail, Phone, MapPin, FileText, Check, Loader2, AlertCircle, Link, Copy, ExternalLink } from 'lucide-react';
import { adminAPI } from '@/services/api';

export function Company() {
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: ''
  });
  const [storeUrl, setStoreUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await adminAPI.getConfig();
        if (config.company_data) {
          setFormData({
            name: config.company_data.name || '',
            cnpj: config.company_data.cnpj || '',
            email: config.company_data.email || '',
            phone: config.company_data.phone || '',
            address: config.company_data.address || ''
          });
          if (config.company_data.slug) {
            setSlug(config.company_data.slug);
            setStoreUrl(`${window.location.origin}/loja/${config.company_data.slug}`);
          }
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
      const response = await adminAPI.updateConfig({
        company_data: formData
      });
      
      // Atualiza o slug e URL da loja se retornados
      if (response.slug) {
        setSlug(response.slug);
        setStoreUrl(`${window.location.origin}/loja/${response.slug}`);
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setError(err.response?.data?.detail || 'Erro ao salvar dados');
    } finally {
      setLoading(false);
    }
  };

  const copyStoreUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading && !formData.name) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dados da Empresa</h1>
        <p className="text-gray-600 mt-1">
          Gerencie as informações da sua empresa
        </p>
      </div>

      {/* Link da Loja */}
      {storeUrl && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl shadow-lg p-6 max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Link className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Link da sua Loja</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Compartilhe este link com seus clientes para eles comprarem vouchers diretamente da sua empresa.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3">
              <span className="text-gray-800 font-mono text-sm break-all">{storeUrl}</span>
            </div>
            <button
              onClick={copyStoreUrl}
              className="px-4 py-3 bg-primary hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Copiar link"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-secondary hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Abrir loja"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl">
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
              Nome da Empresa
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              CNPJ
            </label>
            <input
              type="text"
              required
              value={formData.cnpj}
              onChange={(e) =>
                setFormData({ ...formData, cnpj: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Endereço
            </label>
            <textarea
              required
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
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
