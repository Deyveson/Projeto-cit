from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import AuthService
from app.core.security import decode_access_token
import logging

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency para obter o usuário atual"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado"
        )
    
    email = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    user = await AuthService.get_user_by_email(email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado"
        )
    
    return user


async def get_current_admin(current_user: dict = Depends(get_current_user)):
    """Dependency para verificar se o usuário é admin"""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas administradores."
        )
    return current_user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Registra um novo usuário"""
    user = await AuthService.register_user(user_data)
    
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user["role"],
        hours_balance=user["hours_balance"],
        created_at=user["created_at"].isoformat()
    )


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin):
    """Autentica um usuário e retorna o token"""
    result = await AuthService.authenticate_user(login_data)
    return Token(
        access_token=result["access_token"],
        token_type=result["token_type"]
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Retorna os dados do usuário autenticado"""
    return UserResponse(
        id=str(current_user["_id"]),
        name=current_user["name"],
        email=current_user["email"],
        role=current_user["role"],
        hours_balance=current_user.get("hours_balance", 0.0),
        created_at=current_user["created_at"].isoformat()
    )

@router.post("/update_hours")
async def update_hours(email: str = Body(...), hours: float = Body(...)):
    """Atualiza o saldo de horas do usuário cliente pelo email"""
    logging.warning(f"[update_hours] email recebido: {email}")
    logging.warning(f"[update_hours] hours recebido: {hours}")
    updated = await AuthService.update_hours_by_email(email, hours)
    if not updated:
        raise HTTPException(status_code=404, detail="Usuário não encontrado ou horas não atualizadas")
    return {"message": f"Saldo de horas atualizado para {hours} para o usuário {email}"}
