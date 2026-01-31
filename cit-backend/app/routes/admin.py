from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.routes.auth import get_current_admin
from app.schemas.voucher import VoucherCreate, VoucherUpdate, VoucherResponse
from app.services.voucher_service import VoucherService
from app.database.mongo import get_database
from bson import ObjectId
from datetime import datetime
import re
import os

router = APIRouter(prefix="/admin", tags=["Admin"])


def generate_slug(name: str) -> str:
    """Gera um slug a partir do nome da empresa"""
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
    
    # Dados por mês (últimos 6 meses)
    monthly_pipeline = [
        {"$match": {"status": "paid"}},
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"}
                },
                "vendas": {"$sum": 1},
                "valor": {"$sum": "$total_amount"}
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}},
        {"$limit": 12}
    ]
    
    monthly_result = await db.orders.aggregate(monthly_pipeline).to_list(length=12)
    
    # Formata os dados mensais
    month_names = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    monthly_data = []
    
    for item in monthly_result:
        month_num = item["_id"]["month"]
        monthly_data.append({
            "month": month_names[month_num],
            "year": item["_id"]["year"],
            "vendas": item["vendas"],
            "valor": round(item["valor"], 2)
        })
    
    # Se não houver dados, cria array vazio
    if not monthly_data:
        monthly_data = []
    
    return {
        "total_users": total_users,
        "total_orders": total_orders,
        "paid_orders": paid_orders,
        "pending_orders": pending_orders,
        "total_revenue": total_revenue,
        "monthly_data": monthly_data
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
    
    # Gera o slug automaticamente baseado no nome
    if "name" in company_data and company_data["name"]:
        company_data["slug"] = generate_slug(company_data["name"])
    
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
    
    # Gera a URL da loja
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    store_url = f"{frontend_url}/loja/{company_data.get('slug', '')}"
    
    return {
        "message": "Informações da empresa atualizadas com sucesso",
        "slug": company_data.get("slug"),
        "store_url": store_url
    }


@router.get("/company")
async def get_company_info(current_user: dict = Depends(get_current_admin)):
    """Retorna informações da empresa (apenas admin)"""
    db = get_database()
    config = await db.config.find_one({"type": "company"})
    
    if not config:
        return {}
    
    config["id"] = str(config.pop("_id"))
    
    # Gera a URL da loja
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    if config.get("slug"):
        config["store_url"] = f"{frontend_url}/loja/{config['slug']}"
    
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


@router.get("/config")
async def get_config(current_user: dict = Depends(get_current_admin)):
    """Retorna todas as configurações (empresa + financeiro vinculados)"""
    db = get_database()
    
    # Busca a empresa principal (única por admin no momento)
    company = await db.companies.find_one({})
    
    if not company:
        return {}
    
    company_id = str(company["_id"])
    company.pop("_id", None)
    
    result = {
        "company_id": company_id,
        "company_data": {
            "name": company.get("name", ""),
            "cnpj": company.get("cnpj", ""),
            "email": company.get("email", ""),
            "phone": company.get("phone", ""),
            "address": company.get("address", ""),
            "slug": company.get("slug", ""),
        },
        "financial_data": {
            "bank": company.get("bank", ""),
            "agency": company.get("agency", ""),
            "account": company.get("account", ""),
            "accountType": company.get("accountType", "Conta Corrente"),
            "pixKey": company.get("pixKey", ""),
        }
    }
    
    # Adiciona a URL da loja se houver slug
    if company.get("slug"):
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        result["company_data"]["store_url"] = f"{frontend_url}/loja/{company['slug']}"
    
    return result


@router.put("/config")
async def update_config(
    config_data: dict,
    current_user: dict = Depends(get_current_admin)
):
    """Atualiza configurações (empresa e financeiro vinculados em um documento)"""
    db = get_database()
    
    # Prepara os dados para salvar
    update_data = {}
    slug = None
    
    # Dados da empresa
    if "company_data" in config_data:
        company_data = config_data["company_data"]
        update_data["name"] = company_data.get("name", "")
        update_data["cnpj"] = company_data.get("cnpj", "")
        update_data["email"] = company_data.get("email", "")
        update_data["phone"] = company_data.get("phone", "")
        update_data["address"] = company_data.get("address", "")
        
        # Gera o slug automaticamente baseado no nome
        if company_data.get("name"):
            slug = generate_slug(company_data["name"])
            update_data["slug"] = slug
    
    # Dados financeiros
    if "financial_data" in config_data:
        financial_data = config_data["financial_data"]
        update_data["bank"] = financial_data.get("bank", "")
        update_data["agency"] = financial_data.get("agency", "")
        update_data["account"] = financial_data.get("account", "")
        update_data["accountType"] = financial_data.get("accountType", "Conta Corrente")
        update_data["pixKey"] = financial_data.get("pixKey", "")
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Busca empresa existente
    company = await db.companies.find_one({})
    
    if company:
        await db.companies.update_one(
            {"_id": company["_id"]},
            {"$set": update_data}
        )
        company_id = str(company["_id"])
    else:
        update_data["created_at"] = datetime.utcnow()
        result = await db.companies.insert_one(update_data)
        company_id = str(result.inserted_id)
    
    # Retorna o slug e company_id para o frontend
    response = {
        "message": "Configurações atualizadas com sucesso",
        "company_id": company_id
    }
    if slug:
        response["slug"] = slug
    
    return response


@router.get("/financial-report")
async def get_financial_report(current_user: dict = Depends(get_current_admin)):
    """Retorna relatório financeiro com vendas por empresa"""
    db = get_database()
    
    # Busca a empresa
    company = await db.companies.find_one({})
    
    if not company:
        return {
            "company": None,
            "total_orders": 0,
            "paid_orders": 0,
            "pending_orders": 0,
            "total_revenue": 0,
            "orders_by_status": [],
            "recent_orders": []
        }
    
    company_slug = company.get("slug", "")
    
    # Total de pedidos da empresa
    total_orders = await db.orders.count_documents({"company_slug": company_slug})
    paid_orders = await db.orders.count_documents({"company_slug": company_slug, "status": "paid"})
    pending_orders = await db.orders.count_documents({"company_slug": company_slug, "status": "pending"})
    
    # Receita total
    pipeline = [
        {"$match": {"company_slug": company_slug, "status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(length=1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Vendas por mês
    monthly_pipeline = [
        {"$match": {"company_slug": company_slug, "status": "paid"}},
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"}
                },
                "vendas": {"$sum": 1},
                "valor": {"$sum": "$total_amount"}
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}},
        {"$limit": 12}
    ]
    monthly_result = await db.orders.aggregate(monthly_pipeline).to_list(length=12)
    
    month_names = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    monthly_data = []
    for item in monthly_result:
        month_num = item["_id"]["month"]
        monthly_data.append({
            "month": month_names[month_num],
            "year": item["_id"]["year"],
            "vendas": item["vendas"],
            "valor": round(item["valor"], 2)
        })
    
    # Últimos pedidos
    recent_orders = await db.orders.find(
        {"company_slug": company_slug}
    ).sort("created_at", -1).limit(10).to_list(length=10)
    
    for order in recent_orders:
        order["id"] = str(order.pop("_id"))
        user = await db.users.find_one({"_id": ObjectId(order["user_id"])})
        order["user_name"] = user["name"] if user else "Desconhecido"
        order["user_email"] = user["email"] if user else ""
    
    return {
        "company": {
            "id": str(company["_id"]),
            "name": company.get("name", ""),
            "cnpj": company.get("cnpj", ""),
            "slug": company_slug,
            "bank": company.get("bank", ""),
            "agency": company.get("agency", ""),
            "account": company.get("account", ""),
            "accountType": company.get("accountType", ""),
            "pixKey": company.get("pixKey", ""),
        },
        "total_orders": total_orders,
        "paid_orders": paid_orders,
        "pending_orders": pending_orders,
        "total_revenue": total_revenue,
        "monthly_data": monthly_data,
        "recent_orders": recent_orders
    }


@router.post("/migrate-data")
async def migrate_company_data(current_user: dict = Depends(get_current_admin)):
    """Migra dados da coleção config antiga para a nova coleção companies"""
    db = get_database()
    
    # Verifica se já existe empresa na nova coleção
    existing = await db.companies.find_one({})
    if existing:
        return {"message": "Migração já realizada", "company_id": str(existing["_id"])}
    
    # Busca dados antigos
    old_company = await db.config.find_one({"type": "company"})
    old_financial = await db.config.find_one({"type": "financial"})
    
    if not old_company and not old_financial:
        return {"message": "Nenhum dado para migrar"}
    
    # Monta o novo documento
    new_company = {
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    if old_company:
        new_company["name"] = old_company.get("name", "")
        new_company["cnpj"] = old_company.get("cnpj", "")
        new_company["email"] = old_company.get("email", "")
        new_company["phone"] = old_company.get("phone", "")
        new_company["address"] = old_company.get("address", "")
        new_company["slug"] = old_company.get("slug", "")
        if not new_company["slug"] and new_company["name"]:
            new_company["slug"] = generate_slug(new_company["name"])
    
    if old_financial:
        new_company["bank"] = old_financial.get("bank", "")
        new_company["agency"] = old_financial.get("agency", "")
        new_company["account"] = old_financial.get("account", "")
        new_company["accountType"] = old_financial.get("accountType", "Conta Corrente")
        new_company["pixKey"] = old_financial.get("pixKey", "")
    
    # Insere na nova coleção
    result = await db.companies.insert_one(new_company)
    
    return {
        "message": "Migração concluída com sucesso",
        "company_id": str(result.inserted_id)
    }
