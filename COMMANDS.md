# Guia Rápido de Comandos - CIT

## 🚀 Iniciar o Projeto

### Com Docker (Recomendado)
```powershell
# Iniciar tudo
.\start.ps1

# Ou manualmente
docker-compose up --build -d
```

### Sem Docker
```powershell
# Backend
cd cit-backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (em outro terminal)
cd cit-frontend
npm install
npm run dev
```

## 🛑 Parar o Projeto

```powershell
# Parar containers
docker-compose down

# Parar e remover volumes (limpa o banco)
docker-compose down -v
```

## 📊 Ver Logs

```powershell
# Todos os logs
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas MongoDB
docker-compose logs -f mongo
```

## 🔄 Reiniciar Serviços

```powershell
# Reiniciar tudo
docker-compose restart

# Reiniciar apenas backend
docker-compose restart backend

# Reconstruir e reiniciar
docker-compose up --build -d
```

## 🗄️ MongoDB

### Acessar o MongoDB
```powershell
# Via Docker
docker exec -it cit-mongodb mongosh

# Comandos dentro do mongo
use cit
show collections
db.users.find().pretty()
db.vouchers.find().pretty()
db.orders.find().pretty()
```

### Limpar Banco de Dados
```powershell
# Parar e remover volumes
docker-compose down -v

# Reiniciar
docker-compose up -d
```

## 👤 Gerenciar Usuários

### Criar Admin
```powershell
# Com script
.\create-admin.ps1

# Ou com curl
curl -X POST "http://localhost:8000/auth/register" `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Admin",
    "email": "admin@cit.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### Criar Cliente
```powershell
curl -X POST "http://localhost:8000/auth/register" `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Cliente Teste",
    "email": "cliente@teste.com",
    "password": "senha123"
  }'
```

### Fazer Login
```powershell
curl -X POST "http://localhost:8000/auth/login" `
  -H "Content-Type: application/json" `
  -d '{
    "email": "admin@cit.com",
    "password": "admin123"
  }'
```

## 🧪 Testar API

```powershell
# Com script
.\test-api.ps1

# Health check
curl http://localhost:8000/health

# Listar vouchers
curl http://localhost:8000/client/vouchers

# Ver documentação
start http://localhost:8000/docs
```

## 📦 Gerenciar Vouchers

### Listar Vouchers
```powershell
curl http://localhost:8000/client/vouchers
```

### Criar Voucher (Admin)
```powershell
# Primeiro faça login e pegue o token
$token = "seu_token_aqui"

curl -X POST "http://localhost:8000/admin/vouchers" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "name": "12 Horas",
    "hours": 12,
    "price": 20.0,
    "active": true,
    "description": "Pacote de 12 horas"
  }'
```

## 🛒 Criar Pedido

```powershell
# Fazer login primeiro
$login = Invoke-RestMethod -Uri "http://localhost:8000/auth/login" `
  -Method Post `
  -Body '{"email":"cliente@teste.com","password":"senha123"}' `
  -ContentType "application/json"

$token = $login.access_token

# Criar pedido
Invoke-RestMethod -Uri "http://localhost:8000/client/orders" `
  -Method Post `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{
    "voucher_id": "id_do_voucher",
    "payment_method": "pix"
  }' `
  -ContentType "application/json"
```

## 💳 Processar Pagamento

### PIX
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/payment/process" `
  -Method Post `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{
    "order_id": "id_do_pedido",
    "payment_method": "pix"
  }' `
  -ContentType "application/json"
```

### Cartão
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/payment/process" `
  -Method Post `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{
    "order_id": "id_do_pedido",
    "payment_method": "credit",
    "card_number": "4111111111111111",
    "card_cvv": "123",
    "card_expiry": "12/25"
  }' `
  -ContentType "application/json"
```

### Confirmar PIX
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/payment/confirm/id_do_pedido" `
  -Method Post `
  -Headers @{Authorization="Bearer $token"}
```

## 📊 Dashboard

### Dashboard Cliente
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/client/dashboard" `
  -Headers @{Authorization="Bearer $token"}
```

### Dashboard Admin
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/admin/dashboard" `
  -Headers @{Authorization="Bearer $token"}
```

## 🐳 Docker Úteis

```powershell
# Ver containers rodando
docker ps

# Ver todos os containers
docker ps -a

# Ver imagens
docker images

# Ver volumes
docker volume ls

# Limpar tudo (cuidado!)
docker system prune -a --volumes

# Entrar no container do backend
docker exec -it cit-backend bash

# Entrar no container do MongoDB
docker exec -it cit-mongodb mongosh
```

## 🔍 Troubleshooting

### Backend não inicia
```powershell
# Ver logs
docker-compose logs backend

# Verificar se a porta 8000 está livre
netstat -ano | findstr :8000

# Reiniciar
docker-compose restart backend
```

### MongoDB não conecta
```powershell
# Ver logs
docker-compose logs mongo

# Verificar se está rodando
docker ps | findstr mongo

# Reiniciar
docker-compose restart mongo
```

### Limpar e recomeçar
```powershell
# Para tudo
docker-compose down -v

# Remove containers antigos
docker container prune -f

# Reconstrói e inicia
docker-compose up --build -d
```

## 📝 Variáveis de Ambiente

### Backend (.env)
```env
MONGODB_URL=mongodb://mongo:27017
DATABASE_NAME=cit
SECRET_KEY=sua-chave-secreta
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000
```

## 🌐 URLs Importantes

- **Backend API**: http://localhost:8000
- **Documentação Swagger**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Frontend**: http://localhost:5173 (se iniciado)
- **MongoDB**: localhost:27017

## 📚 Documentação

- Backend README: `cit-backend/README.md`
- Integration Guide: `INTEGRATION_GUIDE.md`
- API Examples: `cit-frontend/src/services/api-examples.tsx`

## 🆘 Ajuda Rápida

```powershell
# Ver status de tudo
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Reiniciar tudo
docker-compose restart

# Limpar e recomeçar
docker-compose down -v && docker-compose up --build -d
```
