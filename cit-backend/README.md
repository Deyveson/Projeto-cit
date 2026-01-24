# CIT Backend API

Backend completo em FastAPI com MongoDB para sistema de gerenciamento de vouchers e pagamentos.

## 🚀 Tecnologias

- **FastAPI** - Framework web moderno e rápido
- **MongoDB** - Banco de dados NoSQL
- **Motor** - Driver assíncrono do MongoDB
- **JWT** - Autenticação baseada em tokens
- **Docker** - Containerização
- **Pydantic** - Validação de dados

## 📁 Estrutura do Projeto

```
cit-backend/
├── app/
│   ├── main.py              # Aplicação principal
│   ├── core/
│   │   ├── config.py        # Configurações
│   │   └── security.py      # Funções de segurança (JWT, hash)
│   ├── database/
│   │   └── mongo.py         # Conexão com MongoDB
│   ├── models/
│   │   ├── user.py          # Modelo de usuário
│   │   ├── voucher.py       # Modelo de voucher
│   │   ├── order.py         # Modelo de pedido
│   │   └── payment.py       # Modelo de pagamento
│   ├── schemas/
│   │   ├── user.py          # Schemas de validação de usuário
│   │   ├── voucher.py       # Schemas de validação de voucher
│   │   └── order.py         # Schemas de validação de pedido
│   ├── routes/
│   │   ├── auth.py          # Rotas de autenticação
│   │   ├── admin.py         # Rotas administrativas
│   │   ├── client.py        # Rotas do cliente
│   │   └── payment.py       # Rotas de pagamento
│   └── services/
│       ├── auth_service.py      # Lógica de autenticação
│       ├── voucher_service.py   # Lógica de vouchers
│       └── payment_service.py   # Lógica de pagamento
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── README.md
```

## 🔧 Configuração

### 1. Clone o repositório

```bash
cd cit-backend
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure:

```env
MONGODB_URL=mongodb://mongo:27017
DATABASE_NAME=cit
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 3. Execute com Docker (Recomendado)

Na raiz do projeto (onde está o docker-compose.yml):

```bash
docker-compose up --build
```

Isso irá:
- Iniciar o MongoDB na porta 27017
- Iniciar o backend FastAPI na porta 8000

### 4. Ou execute localmente (sem Docker)

```bash
# Instale as dependências
pip install -r requirements.txt

# Execute o servidor
uvicorn app.main:app --reload
```

**Nota:** Certifique-se de ter o MongoDB rodando localmente na porta 27017.

## 📚 Documentação da API

Após iniciar o servidor, acesse:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação.

### Tipos de usuário:
- **admin** - Acesso total ao sistema
- **client** - Acesso às funcionalidades de cliente

### Como usar:

1. Faça o registro ou login
2. Copie o `access_token` da resposta
3. No Swagger, clique em "Authorize" e cole o token
4. Ou adicione o header: `Authorization: Bearer {token}`

## 📋 Endpoints Principais

### Autenticação
- `POST /auth/register` - Registrar novo usuário
- `POST /auth/login` - Fazer login
- `GET /auth/me` - Obter dados do usuário autenticado

### Cliente
- `GET /client/vouchers` - Listar vouchers disponíveis
- `POST /client/orders` - Criar novo pedido
- `GET /client/orders` - Listar meus pedidos
- `GET /client/dashboard` - Dashboard do cliente

### Pagamento
- `POST /payment/process` - Processar pagamento
- `POST /payment/confirm/{order_id}` - Confirmar pagamento PIX
- `GET /payment/status/{order_id}` - Verificar status do pagamento

### Admin
- `POST /admin/vouchers` - Criar voucher
- `PUT /admin/vouchers/{id}` - Atualizar voucher
- `DELETE /admin/vouchers/{id}` - Desativar voucher
- `GET /admin/dashboard` - Dashboard administrativo
- `GET /admin/orders` - Listar todos os pedidos
- `GET /admin/users` - Listar usuários
- `PUT /admin/company` - Atualizar informações da empresa
- `PUT /admin/financial` - Atualizar informações financeiras

## 💳 Vouchers Padrão

O sistema inicializa com 3 vouchers padrão:

| Nome | Horas | Preço |
|------|-------|-------|
| 1 Hora | 1h | R$ 5,00 |
| 3 Horas | 3h | R$ 10,00 |
| 24 Horas | 24h | R$ 25,00 |

## 💰 Fluxo de Pagamento

### PIX
1. Cliente cria um pedido
2. Processa pagamento (recebe QR Code mock)
3. Confirma pagamento manualmente
4. Sistema adiciona horas ao saldo

### Cartão (Crédito/Débito)
1. Cliente cria um pedido
2. Processa pagamento com dados do cartão
3. Aprovação automática (mock)
4. Sistema adiciona horas automaticamente

## 🧪 Testando a API

### 1. Criar um usuário admin

```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@cit.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### 2. Fazer login

```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cit.com",
    "password": "admin123"
  }'
```

### 3. Listar vouchers

```bash
curl -X GET "http://localhost:8000/client/vouchers"
```

## 🐳 Docker

### Comandos úteis

```bash
# Iniciar os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Parar os serviços
docker-compose down

# Reiniciar apenas o backend
docker-compose restart backend

# Remover volumes (limpa o banco)
docker-compose down -v
```

## 📦 Banco de Dados

### Coleções MongoDB

- `users` - Usuários do sistema
- `vouchers` - Pacotes de horas
- `orders` - Pedidos/compras
- `payments` - Registros de pagamento
- `config` - Configurações gerais

### Acessar o MongoDB

```bash
# Via Docker
docker exec -it cit-mongodb mongosh

# Usar o banco
use cit

# Ver usuários
db.users.find().pretty()

# Ver vouchers
db.vouchers.find().pretty()
```

## 🔒 Segurança

- Senhas são hasheadas com bcrypt
- Tokens JWT com expiração configurável
- CORS configurável
- Validação de dados com Pydantic

## 🚧 Próximos Passos

- [ ] Integração real com gateway de pagamento
- [ ] Sistema de logs estruturado
- [ ] Testes unitários e de integração
- [ ] Rate limiting
- [ ] Cache com Redis
- [ ] Notificações por email
- [ ] Sistema de relatórios

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais.
