# Script para iniciar o projeto completo

Write-Host "🚀 Iniciando CIT - Sistema de Gerenciamento de Vouchers" -ForegroundColor Cyan
Write-Host ""

# Verifica se o Docker está instalado
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "❌ Docker não está instalado. Por favor, instale o Docker Desktop." -ForegroundColor Red
    exit 1
}

# Verifica se o Docker está rodando
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker não está rodando. Por favor, inicie o Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Docker está instalado e rodando" -ForegroundColor Green

# Verifica se os arquivos .env existem
Write-Host ""
Write-Host "📝 Verificando arquivos de configuração..." -ForegroundColor Yellow

if (-not (Test-Path "cit-backend\.env")) {
    Write-Host "  Criando cit-backend\.env..." -ForegroundColor Yellow
    Copy-Item "cit-backend\.env.example" "cit-backend\.env"
    Write-Host "  ✓ Arquivo .env criado no backend" -ForegroundColor Green
} else {
    Write-Host "  ✓ Backend .env já existe" -ForegroundColor Green
}

if (-not (Test-Path "cit-frontend\.env")) {
    Write-Host "  Criando cit-frontend\.env..." -ForegroundColor Yellow
    Copy-Item "cit-frontend\.env.example" "cit-frontend\.env"
    Write-Host "  ✓ Arquivo .env criado no frontend" -ForegroundColor Green
} else {
    Write-Host "  ✓ Frontend .env já existe" -ForegroundColor Green
}

# Para containers existentes
Write-Host ""
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
docker-compose down 2>$null

# Inicia os containers
Write-Host ""
Write-Host "🐳 Iniciando containers Docker..." -ForegroundColor Cyan
docker-compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Sistema iniciado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Serviços disponíveis:" -ForegroundColor Cyan
    Write-Host "  - Backend API:      http://localhost:8000" -ForegroundColor White
    Write-Host "  - Documentação:     http://localhost:8000/docs" -ForegroundColor White
    Write-Host "  - MongoDB:          localhost:27017" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
    Write-Host "  1. Acesse http://localhost:8000/docs para ver a documentação da API" -ForegroundColor White
    Write-Host "  2. Inicie o frontend com: cd cit-frontend && npm run dev" -ForegroundColor White
    Write-Host "  3. Crie um usuário admin pelo endpoint /auth/register" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 Ver logs:" -ForegroundColor Yellow
    Write-Host "  docker-compose logs -f" -ForegroundColor White
    Write-Host ""
    Write-Host "🛑 Parar serviços:" -ForegroundColor Yellow
    Write-Host "  docker-compose down" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Erro ao iniciar os containers" -ForegroundColor Red
    Write-Host "Execute 'docker-compose logs' para ver os detalhes" -ForegroundColor Yellow
}
