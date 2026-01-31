// API Service para integração com o backend FastAPI
// Instalar axios: npm install axios

import axios, { AxiosInstance, AxiosError } from 'axios';

// Base URL da API - pode ser configurada via variável de ambiente
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Cria uma instância do axios com configurações padrão
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== TIPOS ====================

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'client';
  hours_balance: number;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'client';
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface Voucher {
  id: string;
  name: string;
  hours: number;
  price: number;
  active: boolean;
  description?: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  voucher_id: string;
  payment_method: 'pix' | 'credit' | 'debit';
  status: 'pending' | 'paid' | 'failed';
  total_amount: number;
  voucher_hours: number;
  created_at: string;
  paid_at?: string;
}

export interface CreateOrderRequest {
  voucher_id: string;
  payment_method: 'pix' | 'credit' | 'debit';
  company_slug?: string;  // Slug da empresa para associar o pedido
}

export interface Payment {
  id: string;
  order_id: string;
  payment_method: string;
  status: string;
  amount: number;
  pix_qrcode?: string;
  pix_key?: string;
  card_last_digits?: string;
  mercadopago_payment_id?: string;
  status_detail?: string;
  installments?: number;
  created_at: string;
}

export interface ProcessPaymentRequest {
  order_id: string;
  payment_method: 'pix' | 'credit' | 'debit';
  card_number?: string;
  card_cvv?: string;
  card_expiry?: string;
  card_token?: string;  // Token do Mercado Pago SDK
  card_payment_method_id?: string;  // visa, master, etc
  card_installments?: number;  // Número de parcelas
  payer_email?: string;  // Email do pagador
  card_holder_name?: string;  // Nome no cartão
  identification_type?: string;  // CPF, CNPJ
  identification_number?: string;  // Número do documento
}

export interface DashboardData {
  hours_balance?: number;
  total_orders?: number;
  paid_orders?: number;
  total_spent?: number;
  total_users?: number;
  pending_orders?: number;
  total_revenue?: number;
}

// ==================== AUTENTICAÇÃO ====================

export const authAPI = {
  /**
   * Registra um novo usuário
   */
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },

  /**
   * Faz login e retorna o token
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    // Salva o token no localStorage
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },

  /**
   * Retorna os dados do usuário autenticado
   */
  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Faz logout removendo o token e limpando o localStorage
   */
  logout: () => {
    localStorage.clear();
  },

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },
};

// ==================== VOUCHERS ====================

export const voucherAPI = {
  /**
   * Lista todos os vouchers disponíveis (público)
   */
  getAll: async (): Promise<Voucher[]> => {
    const response = await api.get<Voucher[]>('/client/vouchers');
    return response.data;
  },

  /**
   * Cria um novo voucher (admin)
   */
  create: async (data: Partial<Voucher>): Promise<Voucher> => {
    const response = await api.post<Voucher>('/admin/vouchers', data);
    return response.data;
  },

  /**
   * Atualiza um voucher (admin)
   */
  update: async (id: string, data: Partial<Voucher>): Promise<Voucher> => {
    const response = await api.put<Voucher>(`/admin/vouchers/${id}`, data);
    return response.data;
  },

  /**
   * Desativa um voucher (admin)
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/admin/vouchers/${id}`);
  },
};

// ==================== PEDIDOS ====================

export const orderAPI = {
  /**
   * Cria um novo pedido
   */
  create: async (data: CreateOrderRequest): Promise<Order> => {
    const response = await api.post<Order>('/client/orders', data);
    return response.data;
  },

  /**
   * Lista os pedidos do usuário autenticado
   */
  getMyOrders: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/client/orders');
    return response.data;
  },

  /**
   * Lista todos os pedidos (admin)
   */
  getAllOrders: async (skip = 0, limit = 50): Promise<Order[]> => {
    const response = await api.get<Order[]>('/admin/orders', {
      params: { skip, limit },
    });
    return response.data;
  },
};

// ==================== PAGAMENTO ====================

export const paymentAPI = {
  /**
   * Retorna a public key do Mercado Pago
   */
  getMercadoPagoPublicKey: async (): Promise<{ public_key: string }> => {
    const response = await api.get<{ public_key: string }>('/payment/mercadopago/public-key');
    return response.data;
  },

  /**
   * Processa um pagamento
   */
  process: async (data: ProcessPaymentRequest): Promise<Payment> => {
    const response = await api.post<Payment>('/payment/process', data);
    return response.data;
  },

  /**
   * Confirma um pagamento PIX
   */
  confirm: async (orderId: string): Promise<{ message: string; hours_added: number }> => {
    const response = await api.post(`/payment/confirm/${orderId}`);
    return response.data;
  },

  /**
   * Verifica o status de um pagamento
   */
  getStatus: async (orderId: string): Promise<Payment> => {
    const response = await api.get<Payment>(`/payment/status/${orderId}`);
    return response.data;
  },
};

// ==================== DASHBOARD ====================

export const dashboardAPI = {
  /**
   * Retorna dados do dashboard do cliente
   */
  getClientDashboard: async (): Promise<DashboardData> => {
    const response = await api.get<DashboardData>('/client/dashboard');
    return response.data;
  },

  /**
   * Retorna dados do dashboard admin
   */
  getAdminDashboard: async (): Promise<DashboardData> => {
    const response = await api.get<DashboardData>('/admin/dashboard');
    return response.data;
  },
};

// ==================== ADMIN ====================

export const adminAPI = {
  /**
   * Lista todos os usuários
   */
  getAllUsers: async (skip = 0, limit = 50): Promise<User[]> => {
    const response = await api.get<User[]>('/admin/users', {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Atualiza informações da empresa
   */
  updateCompany: async (data: any): Promise<{ message: string }> => {
    const response = await api.put('/admin/company', data);
    return response.data;
  },

  /**
   * Retorna informações da empresa
   */
  getCompany: async (): Promise<any> => {
    const response = await api.get('/admin/company');
    return response.data;
  },

  /**
   * Atualiza informações financeiras
   */
  updateFinancial: async (data: any): Promise<{ message: string }> => {
    const response = await api.put('/admin/financial', data);
    return response.data;
  },

  /**
   * Retorna informações financeiras
   */
  getFinancial: async (): Promise<any> => {
    const response = await api.get('/admin/financial');
    return response.data;
  },

  /**
   * Retorna todas as configurações (empresa + financeiro)
   */
  getConfig: async (): Promise<any> => {
    const response = await api.get('/admin/config');
    return response.data;
  },

  /**
   * Atualiza configurações (empresa e/ou financeiro)
   */
  updateConfig: async (data: any): Promise<{ message: string }> => {
    const response = await api.put('/admin/config', data);
    return response.data;
  },
};

// Exporta a instância do axios para uso customizado
export default api;
