# 🌐 CIT - Sistema de Gestão de Vouchers de Internet

<div align="center">

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-20.10+-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Sistema completo de gerenciamento de vouchers de internet com frontend React, backend FastAPI e MongoDB.

</div>

---

## 📋 Sobre o Projeto

O **CIT** é uma plataforma fullstack para gerenciamento de vouchers de internet, permitindo que clientes comprem horas de internet e administradores gerenciem vendas, usuários e configurações da empresa.

### ✨ Funcionalidades

#### 👤 Para Clientes
- 🔐 **Autenticação completa** - Registro e login com JWT
- 📦 **Compra de pacotes** - Seleção de vouchers com diferentes horas e valores
- 💳 **Pagamento flexível** - PIX, Cartão de Crédito ou Débito
- 📊 **Painel do cliente** - Visualização do saldo de horas e histórico de compras
- ✅ **Confirmação de pagamento** - Tela de confirmação após compra

#### 👨‍💼 Para Administradores
- 📈 **Dashboard completo** - Métricas de vendas, receita e usuários
- 📊 **Gráficos interativos** - Vendas e receita por mês com Recharts
- 🗂️ **Gestão de pedidos** - Listagem completa de todas as compras com scroll
- 🏢 **Dados da empresa** - Configuração de informações corporativas
- 💰 **Configurações financeiras** - Gerenciamento de dados de pagamento

---

## 🛠️ Tecnologias

### Frontend
- **React 18.3.1** - Biblioteca para construção de interfaces
- **TypeScript 5.6.2** - Superset JavaScript com tipagem estática
- **Vite 6.3.5** - Build tool e dev server ultra-rápido
- **TailwindCSS 3.4.1** - Framework CSS utility-first
- **Radix UI** - Componentes acessíveis e não-estilizados
- **Recharts 2.15.0** - Biblioteca de gráficos para React
- **Axios 1.6.5** - Cliente HTTP para requisições à API
- **React Router 7.1.3** - Roteamento de páginas
- **Lucide React** - Ícones modernos e customizáveis

### Backend
- **FastAPI 0.109.0** - Framework web moderno e rápido
- **Python 3.11+** - Linguagem de programação
- **Motor 3.3.2** - Driver assíncrono para MongoDB
- **PyMongo 4.6.1** - Driver Python para MongoDB
- **Pydantic 2.5.3** - Validação de dados com Python
- **PyJWT 2.8.0** - Geração e validação de tokens JWT
- **Passlib 1.7.4** - Hashing de senhas
- **Bcrypt 4.0.1** - Algoritmo de criptografia

### Database & DevOps
- **MongoDB 7.0** - Banco de dados NoSQL orientado a documentos
- **Docker** - Containerização de aplicações
- **Docker Compose** - Orquestração de múltiplos containers

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ e npm/yarn
- Python 3.11+
- Docker e Docker Compose
- Git

### 1️⃣ Clone o repositório

```bash
git clone https://github.com/seu-usuario/projeto-cit.git
cd projeto-cit
```

### 2️⃣ Configure o Backend

```bash
cd cit-backend

# Crie um ambiente virtual Python
python -m venv venv

# Ative o ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt
```

### 3️⃣ Configure o Frontend

```bash
cd cit-frontend

# Instale as dependências
npm install
# ou
yarn install
```

### 4️⃣ Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do backend:

```env
# Backend
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=cit_db
SECRET_KEY=sua-chave-secreta-super-segura-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Admin padrão
ADMIN_EMAIL=admin@cit.com
ADMIN_PASSWORD=admin123
```

---

## 🐳 Executando com Docker

### Opção 1: Usando Docker Compose (Recomendado)

```bash
# Na raiz do projeto
docker-compose up -d
```

Isso irá iniciar:
- **MongoDB** na porta `27017`
- **Backend** na porta `8000`
- **Frontend** na porta `5173`

### Opção 2: Executando localmente

#### Backend
```bash
cd cit-backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd cit-frontend
npm run dev
# ou
yarn dev
```

---

## 💻 Como Usar

### Acesso à Aplicação

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Documentação API**: http://localhost:8000/docs

### Usuários Padrão

#### Administrador
- **Email**: admin@cit.com
- **Senha**: admin123

#### Cliente de Teste
- **Email**: cliente@example.com
- **Senha**: senha123

### Fluxo de Uso

1. **Como Cliente:**
   - Acesse a página inicial
   - Escolha um pacote de horas
   - Faça login ou cadastre-se
   - Selecione a forma de pagamento
   - Confirme a compra
   - Acesse seu painel para ver o saldo

2. **Como Administrador:**
   - Faça login com credenciais admin
   - Visualize o dashboard com métricas
   - Gerencie pedidos e usuários
   - Configure dados da empresa
   - Ajuste configurações financeiras

---

## 📁 Estrutura do Projeto

```
projeto-cit/
├── cit-backend/              # Backend FastAPI
│   ├── routers/             # Rotas da API
│   │   ├── auth.py          # Autenticação
│   │   ├── admin.py         # Rotas admin
│   │   ├── client.py        # Rotas cliente
│   │   └── payment.py       # Pagamentos
│   ├── models/              # Modelos de dados
│   ├── schemas/             # Schemas Pydantic
│   ├── database.py          # Conexão MongoDB
│   ├── auth.py              # Lógica de autenticação
│   ├── main.py              # Arquivo principal
│   ├── requirements.txt     # Dependências Python
│   └── Dockerfile
│
├── cit-frontend/            # Frontend React
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # Componentes reutilizáveis
│   │   │   ├── pages/       # Páginas da aplicação
│   │   │   │   ├── admin/   # Páginas admin
│   │   │   │   └── client/  # Páginas cliente
│   │   │   ├── context/     # Context API
│   │   │   └── App.tsx      # Componente principal
│   │   ├── services/        # Serviços e API
│   │   │   └── api.ts       # Cliente Axios
│   │   └── styles/          # Estilos CSS
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
└── docker-compose.yml       # Orquestração Docker
```

---

## 🔌 Endpoints da API

### Autenticação
- `POST /auth/register` - Registrar novo usuário
- `POST /auth/login` - Login de usuário
- `GET /auth/me` - Dados do usuário autenticado

### Cliente
- `GET /client/vouchers` - Listar vouchers disponíveis
- `GET /client/orders` - Histórico de pedidos do cliente
- `POST /client/orders` - Criar novo pedido

### Admin
- `GET /admin/dashboard` - Métricas do dashboard
- `GET /admin/orders` - Todos os pedidos (com paginação)
- `GET /admin/config` - Configurações da empresa
- `PUT /admin/config` - Atualizar configurações

### Pagamento
- `POST /payment/process` - Processar pagamento
- `POST /payment/pix` - Gerar pagamento PIX
- `POST /payment/card` - Processar pagamento com cartão

**Documentação completa**: http://localhost:8000/docs

---

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🙏 Agradecimentos

- [Radix UI](https://www.radix-ui.com/) - Componentes acessíveis
- [Lucide Icons](https://lucide.dev/) - Ícones modernos
- [Recharts](https://recharts.org/) - Biblioteca de gráficos
- [TailwindCSS](https://tailwindcss.com/) - Framework CSS
- [FastAPI](https://fastapi.tiangolo.com/) - Framework backend

---

---

<div align="center">

**[⬆ Voltar ao topo](#-cit---sistema-de-gestão-de-vouchers-de-internet)**

Feito com ❤️ e ☕

</div>
- Verifique a documentação da API em `/docs`
- Consulte os logs com `docker-compose logs`

---

**Desenvolvido com ❤️ usando FastAPI + React**
