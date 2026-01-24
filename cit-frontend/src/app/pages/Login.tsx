import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Wifi, AlertCircle, Loader2 } from 'lucide-react';
import { authAPI } from '@/services/api';

export function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Fazer login na API
      await authAPI.login(formData);
      
      // Buscar dados do usuário
      const user = await authAPI.getMe();
      
      // Salvar usuário no localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      // Redirecionar baseado no role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/cliente/painel');
      }
    } catch (err: any) {
      console.error('Erro no login:', err);
      const message = err.response?.data?.detail || 'Email ou senha incorretos';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Wifi className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">CIT</h1>
              <p className="text-gray-600 mt-2">Faça login na sua conta</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="seu@email.com"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>

              <button
                type="button"
                className="w-full text-primary hover:text-blue-700 font-semibold"
              >
                Esqueci minha senha
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                Voltar para página inicial
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
