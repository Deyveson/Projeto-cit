"""
Rotas de Webhook para notificações de pagamento
"""
import os
import hmac
import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, status, Header
from typing import Optional
from app.database.mongo import get_database
from app.services.mercadopago_service import MercadoPagoService
import logging

# Configura logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


def verify_signature(
    x_signature: str,
    x_request_id: str,
    data_id: str
) -> bool:
    """
    Verifica a assinatura do webhook do Mercado Pago
    Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
    """
    webhook_secret = os.getenv("MERCADOPAGO_WEBHOOK_SECRET", "")
    
    if not webhook_secret:
        # Se não tiver secret configurado, aceita (modo desenvolvimento)
        logger.warning("MERCADOPAGO_WEBHOOK_SECRET não configurado - pulando validação")
        return True
    
    try:
        # Extrai ts e v1 do header x-signature
        # Formato: ts=xxx,v1=xxx
        parts = dict(part.split("=") for part in x_signature.split(","))
        ts = parts.get("ts", "")
        v1 = parts.get("v1", "")
        
        if not ts or not v1:
            return False
        
        # Monta o manifest para validação
        # Template: id:[data.id];request-id:[x-request-id];ts:[ts];
        manifest = f"id:{data_id};request-id:{x_request_id};ts:{ts};"
        
        # Gera HMAC SHA256
        expected_signature = hmac.new(
            webhook_secret.encode(),
            manifest.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, v1)
    except Exception as e:
        logger.error(f"Erro ao verificar assinatura: {e}")
        return False


@router.post("/mercadopago")
async def mercadopago_webhook(
    request: Request,
    x_signature: Optional[str] = Header(None, alias="x-signature"),
    x_request_id: Optional[str] = Header(None, alias="x-request-id")
):
    """
    Webhook para receber notificações do Mercado Pago
    
    Tipos de notificação:
    - payment: Notificação de pagamento
    - merchant_order: Notificação de pedido
    """
    try:
        body = await request.json()
    except:
        body = {}
    
    logger.info(f"Webhook recebido: {body}")
    
    # Extrai dados do webhook
    action = body.get("action", "")
    data = body.get("data", {})
    data_id = data.get("id", body.get("id", ""))
    notification_type = body.get("type", "")
    
    # Valida assinatura (se configurada)
    if x_signature and x_request_id and data_id:
        if not verify_signature(x_signature, x_request_id, str(data_id)):
            logger.warning("Assinatura inválida no webhook")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Assinatura inválida"
            )
    
    # Processa notificação de pagamento
    if notification_type == "payment" or action == "payment.created" or action == "payment.updated":
        payment_id = data_id
        
        if payment_id:
            await process_payment_notification(str(payment_id))
    
    # Retorna 200 OK para confirmar recebimento
    return {"status": "ok"}


async def process_payment_notification(payment_id: str):
    """
    Processa uma notificação de pagamento
    Busca os dados do pagamento no Mercado Pago e atualiza o pedido
    """
    db = get_database()
    
    try:
        # Busca dados do pagamento no Mercado Pago
        payment_data = await MercadoPagoService.get_payment(payment_id)
        
        if not payment_data:
            logger.error(f"Pagamento {payment_id} não encontrado no Mercado Pago")
            return
        
        payment_status = payment_data.get("status", "")
        external_reference = payment_data.get("external_reference", "")
        
        logger.info(f"Pagamento {payment_id}: status={payment_status}, ref={external_reference}")
        
        if not external_reference:
            logger.warning(f"Pagamento {payment_id} sem external_reference")
            return
        
        # Mapeia status do Mercado Pago para status interno
        status_mapping = {
            "approved": "paid",
            "pending": "pending",
            "in_process": "pending",
            "rejected": "failed",
            "cancelled": "cancelled",
            "refunded": "refunded"
        }
        
        new_status = status_mapping.get(payment_status, "pending")
        
        # Atualiza o pedido
        update_data = {
            "status": new_status,
            "payment_id": payment_id,
            "payment_status": payment_status,
            "updated_at": datetime.now(timezone.utc)
        }
        
        # Se aprovado, adiciona data de pagamento
        if new_status == "paid":
            update_data["paid_at"] = datetime.now(timezone.utc)
        
        # Atualiza pelo external_reference (que é o order_id)
        result = await db.orders.update_one(
            {"_id": ObjectId(external_reference)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            logger.info(f"Pedido {external_reference} atualizado para status: {new_status}")
            
            # Se aprovado, adiciona horas ao usuário
            if new_status == "paid":
                order = await db.orders.find_one({"_id": ObjectId(external_reference)})
                if order:
                    # Adiciona horas ao usuário
                    await db.users.update_one(
                        {"_id": ObjectId(order["user_id"])},
                        {
                            "$inc": {"hours_balance": order.get("voucher_hours", 0)},
                            "$set": {"updated_at": datetime.now(timezone.utc)}
                        }
                    )
                    
                    # Atualiza o pagamento para confirmado
                    await db.payments.update_one(
                        {"order_id": external_reference},
                        {
                            "$set": {
                                "status": "confirmed",
                                "confirmed_at": datetime.now(timezone.utc),
                                "mercadopago_payment_id": payment_id
                            }
                        }
                    )
                    logger.info(f"Horas adicionadas ao usuário {order['user_id']}: {order.get('voucher_hours', 0)}h")
        else:
            logger.warning(f"Pedido {external_reference} não encontrado para atualização")
        
    except Exception as e:
        logger.error(f"Erro ao processar pagamento {payment_id}: {e}")


# Import necessário para ObjectId
from bson import ObjectId


@router.get("/test")
async def test_webhook():
    """Endpoint de teste para verificar se o webhook está funcionando"""
    return {
        "status": "ok",
        "message": "Webhook endpoint está funcionando",
        "webhook_url": "/webhooks/mercadopago"
    }
