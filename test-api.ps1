# Script para testar a API

$baseUrl = "http://localhost:8000"

Write-Host "🧪 Testando API do CIT" -ForegroundColor Cyan
Write-Host ""

# Teste 1: Health Check
Write-Host "1️⃣  Testando health check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "   ✓ Status: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Erro no health check" -ForegroundColor Red
}

# Teste 2: Root endpoint
Write-Host ""
Write-Host "2️⃣  Testando endpoint raiz..." -ForegroundColor Yellow
try {
    $root = Invoke-RestMethod -Uri "$baseUrl/" -Method Get
    Write-Host "   ✓ $($root.message)" -ForegroundColor Green
    Write-Host "   ✓ Versão: $($root.version)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Erro no endpoint raiz" -ForegroundColor Red
}

# Teste 3: Listar vouchers
Write-Host ""
Write-Host "3️⃣  Listando vouchers..." -ForegroundColor Yellow
try {
    $vouchers = Invoke-RestMethod -Uri "$baseUrl/client/vouchers" -Method Get
    Write-Host "   ✓ Encontrados $($vouchers.Count) vouchers:" -ForegroundColor Green
    foreach ($voucher in $vouchers) {
        Write-Host "      - $($voucher.name): $($voucher.hours)h por R$ $($voucher.price)" -ForegroundColor White
    }
} catch {
    Write-Host "   ✗ Erro ao listar vouchers" -ForegroundColor Red
}

# Teste 4: Criar usuário de teste
Write-Host ""
Write-Host "4️⃣  Criando usuário de teste..." -ForegroundColor Yellow
$testUser = @{
    name = "Cliente Teste"
    email = "teste@example.com"
    password = "senha123"
    role = "client"
} | ConvertTo-Json

try {
    $user = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $testUser -ContentType "application/json"
    Write-Host "   ✓ Usuário criado: $($user.email)" -ForegroundColor Green
    
    # Teste 5: Fazer login
    Write-Host ""
    Write-Host "5️⃣  Testando login..." -ForegroundColor Yellow
    $loginData = @{
        email = "teste@example.com"
        password = "senha123"
    } | ConvertTo-Json
    
    $login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    Write-Host "   ✓ Login realizado com sucesso" -ForegroundColor Green
    Write-Host "   ✓ Token recebido: $($login.access_token.Substring(0, 20))..." -ForegroundColor Green
    
    # Teste 6: Buscar dados do usuário
    Write-Host ""
    Write-Host "6️⃣  Buscando dados do usuário..." -ForegroundColor Yellow
    $headers = @{
        Authorization = "Bearer $($login.access_token)"
    }
    $me = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $headers
    Write-Host "   ✓ Usuário: $($me.name)" -ForegroundColor Green
    Write-Host "   ✓ Email: $($me.email)" -ForegroundColor Green
    Write-Host "   ✓ Saldo: $($me.hours_balance) horas" -ForegroundColor Green
    
} catch {
    $errorMessage = $_.Exception.Message
    if ($errorMessage -like "*400*" -and $errorMessage -like "*Email já cadastrado*") {
        Write-Host "   ℹ Usuário de teste já existe" -ForegroundColor Yellow
    } else {
        Write-Host "   ✗ Erro: $errorMessage" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Testes concluídos!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Documentação completa: $baseUrl/docs" -ForegroundColor Cyan
