from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from app.database.mongo import get_database
from app.core.security import verify_password, get_password_hash, create_access_token
from app.schemas.user import UserCreate, UserLogin
from fastapi import HTTPException, status


class AuthService:
    
    @staticmethod
    async def register_user(user_data: UserCreate):
        """Registra um novo usuário"""
        db = get_database()
        
        # Verifica se o email já existe
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já cadastrado"
            )
        
        # Cria o usuário
        user_dict = {
            "name": user_data.name,
            "email": user_data.email,
            "password_hash": get_password_hash(user_data.password),
            "role": user_data.role,
            "hours_balance": 0.0,
            "created_at": datetime.now(timezone.utc),
            "updated_at": None
        }
        
        result = await db.users.insert_one(user_dict)
        user_dict["_id"] = result.inserted_id
        
        return user_dict
    
    @staticmethod
    async def authenticate_user(login_data: UserLogin):
        """Autentica um usuário e retorna o token"""
        db = get_database()
        
        # Busca o usuário pelo email
        user = await db.users.find_one({"email": login_data.email})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos"
            )
        
        # Verifica a senha
        if not verify_password(login_data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos"
            )
        
        # Cria o token
        access_token = create_access_token(
            data={"sub": user["email"], "role": user["role"]}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    
    @staticmethod
    async def get_user_by_email(email: str):
        """Busca um usuário pelo email"""
        db = get_database()
        user = await db.users.find_one({"email": email})
        return user
    
    @staticmethod
    async def get_user_by_id(user_id: str):
        """Busca um usuário pelo ID"""
        db = get_database()
        if not ObjectId.is_valid(user_id):
            return None
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        return user
