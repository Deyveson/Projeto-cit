# Integração Frontend + Backend

Este guia explica como integrar o frontend React com o backend FastAPI.

## 📋 Pré-requisitos

1. Backend rodando na porta 8000
2. Node.js instalado
3. Dependências instaladas no frontend

## 🔧 Configuração

### 1. Instalar dependências no frontend

```bash
cd cit-frontend
npm install axios
```

### 2. Configurar variável de ambiente

```bash
# No diretório cit-frontend
cp .env.example .env
```

Edite o arquivo `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Iniciar o backend

```bash
# Na raiz do projeto
docker-compose up -d
```

Ou localmente:

```bash
cd cit-backend
uvicorn app.main:app --reload
```

### 4. Iniciar o frontend

```bash
cd cit-frontend
npm run dev
```

## 🔌 Usando a API no Frontend

O arquivo `src/services/api.ts` já está pronto com todos os endpoints.

### Exemplo: Login

```tsx
import { authAPI } from '@/services/api';

const handleLogin = async () => {
  try {
    const response = await authAPI.login({
      email: 'usuario@email.com',
      password: 'senha123'
    });
    
    // Token é salvo automaticamente no localStorage
    console.log('Token:', response.access_token);
    
    // Buscar dados do usuário
    const user = await authAPI.getMe();
    console.log('Usuário:', user);
    
  } catch (error) {
    console.error('Erro no login:', error);
  }
};
```

### Exemplo: Listar Vouchers

```tsx
import { voucherAPI } from '@/services/api';
import { useState, useEffect } from 'react';

function Packages() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const data = await voucherAPI.getAll();
        setVouchers(data);
      } catch (error) {
        console.error('Erro ao buscar vouchers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, []);

  return (
    <div>
      {loading ? (
        <p>Carregando...</p>
      ) : (
        vouchers.map(voucher => (
          <div key={voucher.id}>
            <h3>{voucher.name}</h3>
            <p>{voucher.hours}h - R$ {voucher.price}</p>
          </div>
        ))
      )}
    </div>
  );
}
```

### Exemplo: Criar Pedido

```tsx
import { orderAPI, paymentAPI } from '@/services/api';

const handlePurchase = async (voucherId: string) => {
  try {
    // 1. Criar pedido
    const order = await orderAPI.create({
      voucher_id: voucherId,
      payment_method: 'credit'
    });

    console.log('Pedido criado:', order);

    // 2. Processar pagamento
    const payment = await paymentAPI.process({
      order_id: order.id,
      payment_method: 'credit',
      card_number: '4111111111111111',
      card_cvv: '123',
      card_expiry: '12/25'
    });

    console.log('Pagamento processado:', payment);

    if (payment.status === 'confirmed') {
      alert('Compra realizada com sucesso!');
    }
  } catch (error) {
    console.error('Erro na compra:', error);
  }
};
```

### Exemplo: Dashboard Cliente

```tsx
import { dashboardAPI } from '@/services/api';
import { useState, useEffect } from 'react';

function ClientPanel() {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await dashboardAPI.getClientDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error('Erro ao buscar dashboard:', error);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div>
      <h1>Meu Painel</h1>
      <p>Saldo de horas: {dashboardData?.hours_balance}h</p>
      <p>Total gasto: R$ {dashboardData?.total_spent}</p>
      <p>Pedidos: {dashboardData?.total_orders}</p>
    </div>
  );
}
```

## 🔐 Proteção de Rotas

### Hook customizado para autenticação

```tsx
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { authAPI, User } from '@/services/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (authAPI.isAuthenticated()) {
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
        } catch (error) {
          console.error('Erro ao buscar usuário:', error);
          authAPI.logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    await authAPI.login({ email, password });
    const userData = await authAPI.getMe();
    setUser(userData);
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  return { user, loading, login, logout, isAdmin: user?.role === 'admin' };
}
```

### Componente de rota protegida

```tsx
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/client/panel" replace />;
  }

  return children;
}
```

### Usar nas rotas

```tsx
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rotas protegidas */}
        <Route
          path="/client/panel"
          element={
            <ProtectedRoute>
              <ClientPanel />
            </ProtectedRoute>
          }
        />
        
        {/* Rotas admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

## 🎨 Tratamento de Erros

```tsx
import axios from 'axios';

const handleApiError = (error: any) => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Erro da API
      const message = error.response.data.detail || 'Erro ao processar requisição';
      alert(message);
    } else if (error.request) {
      // Sem resposta do servidor
      alert('Servidor não está respondendo. Verifique sua conexão.');
    } else {
      alert('Erro ao fazer requisição');
    }
  }
};

// Uso
try {
  await authAPI.login(credentials);
} catch (error) {
  handleApiError(error);
}
```

## 📱 Exemplo de Fluxo Completo

### Fluxo de Compra de Voucher

```tsx
import { useState } from 'react';
import { voucherAPI, orderAPI, paymentAPI } from '@/services/api';

function PurchaseFlow() {
  const [step, setStep] = useState<'select' | 'payment' | 'confirm'>('select');
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);

  // Passo 1: Selecionar voucher
  const handleSelectVoucher = (voucher) => {
    setSelectedVoucher(voucher);
    setStep('payment');
  };

  // Passo 2: Escolher forma de pagamento
  const handlePaymentMethod = async (method: 'pix' | 'credit' | 'debit') => {
    try {
      // Criar pedido
      const newOrder = await orderAPI.create({
        voucher_id: selectedVoucher.id,
        payment_method: method
      });
      setOrder(newOrder);

      // Processar pagamento
      let paymentData;
      if (method === 'pix') {
        paymentData = await paymentAPI.process({
          order_id: newOrder.id,
          payment_method: 'pix'
        });
        // Mostrar QR Code: paymentData.pix_qrcode
      } else {
        // Cartão - coletar dados do usuário primeiro
        const cardData = {
          order_id: newOrder.id,
          payment_method: method,
          card_number: '4111111111111111',
          card_cvv: '123',
          card_expiry: '12/25'
        };
        paymentData = await paymentAPI.process(cardData);
      }

      setPayment(paymentData);
      setStep('confirm');
    } catch (error) {
      console.error('Erro no pagamento:', error);
    }
  };

  // Passo 3: Confirmar (para PIX)
  const handleConfirmPix = async () => {
    try {
      await paymentAPI.confirm(order.id);
      alert('Pagamento confirmado! Horas adicionadas ao seu saldo.');
    } catch (error) {
      console.error('Erro ao confirmar:', error);
    }
  };

  return (
    <div>
      {step === 'select' && (
        <VoucherList onSelect={handleSelectVoucher} />
      )}
      {step === 'payment' && (
        <PaymentMethod onSelect={handlePaymentMethod} />
      )}
      {step === 'confirm' && (
        <PaymentConfirm
          payment={payment}
          onConfirm={handleConfirmPix}
        />
      )}
    </div>
  );
}
```

## 🧪 Testando a Integração

### 1. Criar usuário de teste

```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cliente Teste",
    "email": "cliente@teste.com",
    "password": "senha123",
    "role": "client"
  }'
```

### 2. Testar no frontend

```tsx
const testIntegration = async () => {
  // Login
  await authAPI.login({
    email: 'cliente@teste.com',
    password: 'senha123'
  });

  // Buscar vouchers
  const vouchers = await voucherAPI.getAll();
  console.log('Vouchers:', vouchers);

  // Criar pedido
  const order = await orderAPI.create({
    voucher_id: vouchers[0].id,
    payment_method: 'credit'
  });
  console.log('Pedido:', order);

  // Processar pagamento
  const payment = await paymentAPI.process({
    order_id: order.id,
    payment_method: 'credit',
    card_number: '4111111111111111',
    card_cvv: '123',
    card_expiry: '12/25'
  });
  console.log('Pagamento:', payment);

  // Verificar saldo
  const user = await authAPI.getMe();
  console.log('Saldo de horas:', user.hours_balance);
};
```

## 🔍 Debug

### Ver requisições no console

```tsx
import api from '@/services/api';

// Adicione interceptor para log
api.interceptors.request.use(request => {
  console.log('Starting Request', request);
  return request;
});

api.interceptors.response.use(response => {
  console.log('Response:', response);
  return response;
});
```

### Verificar token

```tsx
const token = localStorage.getItem('access_token');
console.log('Token:', token);

// Decodificar (básico - não valida assinatura)
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Payload:', payload);
}
```

## ✅ Checklist de Integração

- [ ] Backend rodando na porta 8000
- [ ] Frontend rodando na porta 5173 (ou outra)
- [ ] CORS configurado no backend
- [ ] Arquivo `.env` criado no frontend
- [ ] Dependência `axios` instalada
- [ ] Arquivo `api.ts` importado corretamente
- [ ] Token sendo salvo no localStorage após login
- [ ] Token sendo enviado nas requisições autenticadas
- [ ] Tratamento de erros implementado
- [ ] Rotas protegidas configuradas
