"""
Rotas públicas - Acesso por slug da empresa
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from app.database.mongo import get_database
from app.schemas.voucher import VoucherResponse
from bson import ObjectId
import re

router = APIRouter(prefix="/store", tags=["Public Store"])


def generate_slug(name: str) -> str:
    """Gera um slug a partir do nome da empresa"""
    # Remove acentos e caracteres especiais
    slug = name.lower().strip()
    slug = re.sub(r'[àáâãäå]', 'a', slug)
    slug = re.sub(r'[èéêë]', 'e', slug)
    slug = re.sub(r'[ìíîï]', 'i', slug)
    slug = re.sub(r'[òóôõö]', 'o', slug)
    slug = re.sub(r'[ùúûü]', 'u', slug)
    slug = re.sub(r'[ç]', 'c', slug)
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    return slug


@router.get("/{slug}")
async def get_store_info(slug: str):
    """Retorna informações da empresa pelo slug"""
    db = get_database()
    
    # Busca empresa pelo slug na nova coleção companies
    company = await db.companies.find_one({"slug": slug})
    
    if not company:
        # Tenta buscar pela primeira empresa e verificar se o slug bate
        company = await db.companies.find_one({})
        if company:
            # Gera o slug esperado
            expected_slug = generate_slug(company.get("name", ""))
            if expected_slug != slug:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Empresa não encontrada"
                )
            # Atualiza o slug no banco
            await db.companies.update_one(
                {"_id": company["_id"]},
                {"$set": {"slug": expected_slug}}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa não encontrada"
            )
    
    return {
        "id": str(company["_id"]),
        "name": company.get("name", ""),
        "slug": slug,
        "logo": company.get("logo"),
        "email": company.get("email"),
        "phone": company.get("phone"),
        "address": company.get("address"),
        "cnpj": company.get("cnpj"),
        "payment_methods": {
            "pix": bool(company.get("pixKey")),
            "credit": True,
            "debit": True
        }
    }


@router.get("/{slug}/vouchers", response_model=List[VoucherResponse])
async def get_store_vouchers(slug: str):
    """Lista todos os vouchers disponíveis para uma empresa específica"""
    db = get_database()
    
    # Verifica se a empresa existe na nova coleção companies
    company = await db.companies.find_one({"slug": slug})
    
    if not company:
        # Tenta buscar pela primeira empresa
        company = await db.companies.find_one({})
        if company:
            expected_slug = generate_slug(company.get("name", ""))
            if expected_slug != slug:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Empresa não encontrada"
                )
            # Atualiza o slug
            await db.companies.update_one(
                {"_id": company["_id"]},
                {"$set": {"slug": slug}}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa não encontrada"
            )
    
    # Busca vouchers ativos
    vouchers = await db.vouchers.find({"active": True}).to_list(length=100)
    
    return [
        VoucherResponse(
            id=str(voucher["_id"]),
            name=voucher["name"],
            hours=voucher["hours"],
            price=voucher["price"],
            active=voucher["active"],
            description=voucher.get("description"),
            created_at=voucher["created_at"].isoformat()
        )
        for voucher in vouchers
    ]


@router.get("/{slug}/voucher/{voucher_id}")
async def get_store_voucher(slug: str, voucher_id: str):
    """Retorna um voucher específico da empresa"""
    db = get_database()
    
    # Verifica se a empresa existe
    company = await db.companies.find_one({"slug": slug})
    if not company:
        company = await db.companies.find_one({})
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa não encontrada"
            )
    
    # Busca o voucher
    if not ObjectId.is_valid(voucher_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID do voucher inválido"
        )
    
    voucher = await db.vouchers.find_one({
        "_id": ObjectId(voucher_id),
        "active": True
    })
    
    if not voucher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Voucher não encontrado"
        )
    
    return VoucherResponse(
        id=str(voucher["_id"]),
        name=voucher["name"],
        hours=voucher["hours"],
        price=voucher["price"],
        active=voucher["active"],
        description=voucher.get("description"),
        created_at=voucher["created_at"].isoformat()
    )
