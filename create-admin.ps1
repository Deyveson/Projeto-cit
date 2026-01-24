# Script para criar um usuário admin inicial

$baseUrl = "http://localhost:8000"

Write-Host "👤 Criando usuário administrador..." -ForegroundColor Cyan
Write-Host ""

# Solicita dados do admin
$name = Read-Host "Nome completo"
$email = Read-Host "Email"
$password = Read-Host "Senha" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

# Cria o payload
$body = @{
    name = $name
    email = $email
    password = $passwordPlain
    role = "admin"
} | ConvertTo-Json

Write-Host ""
Write-Host "📤 Enviando requisição..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
    
    Write-Host ""
    Write-Host "✅ Usuário admin criado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Dados do usuário:" -ForegroundColor Cyan
    Write-Host "  ID:    $($response.id)" -ForegroundColor White
    Write-Host "  Nome:  $($response.name)" -ForegroundColor White
    Write-Host "  Email: $($response.email)" -ForegroundColor White
    Write-Host "  Role:  $($response.role)" -ForegroundColor White
    Write-Host ""
    Write-Host "🔑 Agora você pode fazer login com essas credenciais!" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao criar usuário:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host $responseBody -ForegroundColor Yellow
    }
}
