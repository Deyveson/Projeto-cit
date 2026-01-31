from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.routes.auth import get_current_user
from app.schemas.voucher import VoucherResponse
from app.schemas.order import OrderCreate, OrderResponse
from app.services.voucher_service import VoucherService
from app.database.mongo import get_database

router = APIRouter(prefix="/client", tags=["Client"])


@router.get("/vouchers", response_model=List[VoucherResponse])
async def get_vouchers():
    """Lista todos os vouchers disponíveis (público)"""
    vouchers = await VoucherService.get_all_vouchers(active_only=True)
    
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


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: dict = Depends(get_current_user)
):
    """Cria um novo pedido"""
    db = get_database()
    
    # Busca o voucher
    voucher = await VoucherService.get_voucher_by_id(order_data.voucher_id)
    
    if not voucher["active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voucher não disponível"
        )
    
    # Valida método de pagamento
    if order_data.payment_method not in ["pix", "credit", "debit"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Método de pagamento inválido"
        )
    
    # Busca os dados da empresa para associar ao pedido
    # Se tiver slug, busca por ele, senão busca a empresa padrão
    if order_data.company_slug:
        company_config = await db.config.find_one({
            "type": "company",
            "slug": order_data.company_slug
        })
        # Se não encontrar pelo slug, tenta buscar e verificar pelo nome
        if not company_config:
            company_config = await db.config.find_one({"type": "company"})
    else:
        company_config = await db.config.find_one({"type": "company"})
    
    company_data = None
    if company_config:
        company_data = {
            "name": company_config.get("name", ""),
            "slug": company_config.get("slug", order_data.company_slug),
            "cnpj": company_config.get("cnpj", ""),
            "email": company_config.get("email", ""),
            "phone": company_config.get("phone", ""),
            "address": company_config.get("address", "")
        }
    
    # Cria o pedido
    order_dict = {
        "user_id": str(current_user["_id"]),
        "voucher_id": order_data.voucher_id,
        "payment_method": order_data.payment_method,
        "status": "pending",
        "total_amount": voucher["price"],
        "voucher_hours": voucher["hours"],
        "voucher_name": voucher["name"],
        "company": company_data,
        "company_slug": order_data.company_slug,
        "created_at": datetime.now(timezone.utc),
        "paid_at": None
    }
    
    result = await db.orders.insert_one(order_dict)
    order_dict["_id"] = result.inserted_id
    
    return OrderResponse(
        id=str(order_dict["_id"]),
        user_id=order_dict["user_id"],
        voucher_id=order_dict["voucher_id"],
        payment_method=order_dict["payment_method"],
        status=order_dict["status"],
        total_amount=order_dict["total_amount"],
        voucher_hours=order_dict["voucher_hours"],
        created_at=order_dict["created_at"].isoformat(),
        paid_at=None
    )


@router.get("/orders", response_model=List[OrderResponse])
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    """Lista os pedidos do usuário autenticado"""
    db = get_database()
    
    orders = await db.orders.find(
        {"user_id": str(current_user["_id"])}
    ).sort("created_at", -1).to_list(length=100)
    
    return [
        OrderResponse(
            id=str(order["_id"]),
            user_id=order["user_id"],
            voucher_id=order["voucher_id"],
            payment_method=order["payment_method"],
            status=order["status"],
            total_amount=order["total_amount"],
            voucher_hours=order["voucher_hours"],
            created_at=order["created_at"].isoformat(),
            paid_at=order["paid_at"].isoformat() if order.get("paid_at") else None
        )
        for order in orders
    ]


@router.get("/dashboard")
async def get_client_dashboard(current_user: dict = Depends(get_current_user)):
    """Retorna dados do painel do cliente"""
    db = get_database()
    
    # Busca dados atualizados do usuário
    user = await db.users.find_one({"_id": current_user["_id"]})
    
    # Total de pedidos
    total_orders = await db.orders.count_documents({"user_id": str(current_user["_id"])})
    
    # Pedidos pagos
    paid_orders = await db.orders.count_documents({
        "user_id": str(current_user["_id"]),
        "status": "paid"
    })
    
    # Total gasto
    pipeline = [
        {"$match": {"user_id": str(current_user["_id"]), "status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    spent_result = await db.orders.aggregate(pipeline).to_list(length=1)
    total_spent = spent_result[0]["total"] if spent_result else 0
    
    return {
        "hours_balance": user.get("hours_balance", 0.0),
        "total_orders": total_orders,
        "paid_orders": paid_orders,
        "total_spent": total_spent
    }
