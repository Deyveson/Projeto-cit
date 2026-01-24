from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.routes.auth import get_current_admin
from app.schemas.voucher import VoucherCreate, VoucherUpdate, VoucherResponse
from app.services.voucher_service import VoucherService
from app.database.mongo import get_database
from bson import ObjectId

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/vouchers", response_model=VoucherResponse, status_code=status.HTTP_201_CREATED)
async def create_voucher(
    voucher_data: VoucherCreate,
    current_user: dict = Depends(get_current_admin)
):
    """Cria um novo voucher (apenas admin)"""
    voucher = await VoucherService.create_voucher(voucher_data)
    
    return VoucherResponse(
        id=str(voucher["_id"]),
        name=voucher["name"],
        hours=voucher["hours"],
        price=voucher["price"],
        active=voucher["active"],
        description=voucher.get("description"),
        created_at=voucher["created_at"].isoformat()
    )


@router.put("/vouchers/{voucher_id}", response_model=VoucherResponse)
async def update_voucher(
    voucher_id: str,
    voucher_data: VoucherUpdate,
    current_user: dict = Depends(get_current_admin)
):
    """Atualiza um voucher (apenas admin)"""
    voucher = await VoucherService.update_voucher(voucher_id, voucher_data)
    
    return VoucherResponse(
        id=str(voucher["_id"]),
        name=voucher["name"],
        hours=voucher["hours"],
        price=voucher["price"],
        active=voucher["active"],
        description=voucher.get("description"),
        created_at=voucher["created_at"].isoformat()
    )


@router.delete("/vouchers/{voucher_id}")
async def delete_voucher(
    voucher_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Desativa um voucher (apenas admin)"""
    return await VoucherService.delete_voucher(voucher_id)


@router.get("/dashboard")
async def get_admin_dashboard(current_user: dict = Depends(get_current_admin)):
    """Retorna dados do dashboard admin"""
    db = get_database()
    
    # Total de usuários
    total_users = await db.users.count_documents({"role": "client"})
    
    # Total de pedidos
    total_orders = await db.orders.count_documents({})
    paid_orders = await db.orders.count_documents({"status": "paid"})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    
    # Receita total
    pipeline = [
        {"$match": {"status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(length=1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "total_users": total_users,
        "total_orders": total_orders,
        "paid_orders": paid_orders,
        "pending_orders": pending_orders,
        "total_revenue": total_revenue
    }


@router.get("/orders")
async def get_all_orders(
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_admin)
):
    """Lista todos os pedidos (apenas admin)"""
    db = get_database()
    
    orders = await db.orders.find().sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    # Enriquece com dados do usuário
    for order in orders:
        user = await db.users.find_one({"_id": ObjectId(order["user_id"])})
        order["user_name"] = user["name"] if user else "Desconhecido"
        order["user_email"] = user["email"] if user else "Desconhecido"
        order["id"] = str(order.pop("_id"))
    
    return orders


@router.get("/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_admin)
):
    """Lista todos os usuários (apenas admin)"""
    db = get_database()
    
    users = await db.users.find({"role": "client"}).skip(skip).limit(limit).to_list(length=limit)
    
    for user in users:
        user["id"] = str(user.pop("_id"))
        user.pop("password_hash", None)  # Remove o hash da senha
    
    return users


@router.put("/company")
async def update_company_info(
    company_data: dict,
    current_user: dict = Depends(get_current_admin)
):
    """Atualiza informações da empresa (apenas admin)"""
    db = get_database()
    
    # Busca ou cria o documento de configuração
    config = await db.config.find_one({"type": "company"})
    
    if config:
        await db.config.update_one(
            {"type": "company"},
            {"$set": company_data}
        )
    else:
        company_data["type"] = "company"
        await db.config.insert_one(company_data)
    
    return {"message": "Informações da empresa atualizadas com sucesso"}


@router.get("/company")
async def get_company_info(current_user: dict = Depends(get_current_admin)):
    """Retorna informações da empresa (apenas admin)"""
    db = get_database()
    config = await db.config.find_one({"type": "company"})
    
    if not config:
        return {}
    
    config["id"] = str(config.pop("_id"))
    return config


@router.put("/financial")
async def update_financial_info(
    financial_data: dict,
    current_user: dict = Depends(get_current_admin)
):
    """Atualiza informações financeiras (apenas admin)"""
    db = get_database()
    
    config = await db.config.find_one({"type": "financial"})
    
    if config:
        await db.config.update_one(
            {"type": "financial"},
            {"$set": financial_data}
        )
    else:
        financial_data["type"] = "financial"
        await db.config.insert_one(financial_data)
    
    return {"message": "Informações financeiras atualizadas com sucesso"}


@router.get("/financial")
async def get_financial_info(current_user: dict = Depends(get_current_admin)):
    """Retorna informações financeiras (apenas admin)"""
    db = get_database()
    config = await db.config.find_one({"type": "financial"})
    
    if not config:
        return {}
    
    config["id"] = str(config.pop("_id"))
    return config
