from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from app.database.mongo import get_database
from app.schemas.voucher import VoucherCreate, VoucherUpdate
from fastapi import HTTPException, status


class VoucherService:
    
    @staticmethod
    async def create_voucher(voucher_data: VoucherCreate):
        """Cria um novo voucher"""
        db = get_database()
        
        voucher_dict = {
            "name": voucher_data.name,
            "hours": voucher_data.hours,
            "price": voucher_data.price,
            "active": voucher_data.active,
            "description": voucher_data.description,
            "created_at": datetime.now(timezone.utc)
        }
        
        result = await db.vouchers.insert_one(voucher_dict)
        voucher_dict["_id"] = result.inserted_id
        
        return voucher_dict
    
    @staticmethod
    async def get_all_vouchers(active_only: bool = True) -> List:
        """Retorna todos os vouchers"""
        db = get_database()
        
        query = {"active": True} if active_only else {}
        vouchers = await db.vouchers.find(query).to_list(length=100)
        
        return vouchers
    
    @staticmethod
    async def get_voucher_by_id(voucher_id: str):
        """Busca um voucher pelo ID"""
        db = get_database()
        
        if not ObjectId.is_valid(voucher_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do voucher inválido"
            )
        
        voucher = await db.vouchers.find_one({"_id": ObjectId(voucher_id)})
        
        if not voucher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Voucher não encontrado"
            )
        
        return voucher
    
    @staticmethod
    async def update_voucher(voucher_id: str, voucher_data: VoucherUpdate):
        """Atualiza um voucher"""
        db = get_database()
        
        if not ObjectId.is_valid(voucher_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do voucher inválido"
            )
        
        # Remove campos None
        update_data = {k: v for k, v in voucher_data.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nenhum dado para atualizar"
            )
        
        result = await db.vouchers.update_one(
            {"_id": ObjectId(voucher_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Voucher não encontrado"
            )
        
        return await VoucherService.get_voucher_by_id(voucher_id)
    
    @staticmethod
    async def delete_voucher(voucher_id: str):
        """Deleta (desativa) um voucher"""
        db = get_database()
        
        if not ObjectId.is_valid(voucher_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do voucher inválido"
            )
        
        result = await db.vouchers.update_one(
            {"_id": ObjectId(voucher_id)},
            {"$set": {"active": False}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Voucher não encontrado"
            )
        
        return {"message": "Voucher desativado com sucesso"}
    
    @staticmethod
    async def initialize_default_vouchers():
        """Inicializa os vouchers padrão"""
        db = get_database()
        
        # Verifica se já existem vouchers
        count = await db.vouchers.count_documents({})
        if count > 0:
            return
        
        default_vouchers = [
            {
                "name": "1 Hora",
                "hours": 1.0,
                "price": 5.0,
                "active": True,
                "description": "Pacote de 1 hora de acesso",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "name": "3 Horas",
                "hours": 3.0,
                "price": 10.0,
                "active": True,
                "description": "Pacote de 3 horas de acesso",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "name": "24 Horas",
                "hours": 24.0,
                "price": 25.0,
                "active": True,
                "description": "Pacote de 24 horas de acesso",
                "created_at": datetime.now(timezone.utc)
            }
        ]
        
        await db.vouchers.insert_many(default_vouchers)
        print("✓ Vouchers padrão inicializados")
