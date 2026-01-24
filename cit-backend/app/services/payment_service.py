from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
import random
import string
from app.database.mongo import get_database
from app.schemas.order import PaymentCreate
from fastapi import HTTPException, status


class PaymentService:
    
    @staticmethod
    def generate_pix_qrcode() -> str:
        """Gera um QR Code fictício para PIX"""
        # Gera um código aleatório para simular um QR Code PIX
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=32))
    
    @staticmethod
    async def process_payment(payment_data: PaymentCreate):
        """Processa um pagamento (mock)"""
        db = get_database()
        
        # Busca o pedido
        if not ObjectId.is_valid(payment_data.order_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do pedido inválido"
            )
        
        order = await db.orders.find_one({"_id": ObjectId(payment_data.order_id)})
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido não encontrado"
            )
        
        if order["status"] == "paid":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pedido já foi pago"
            )
        
        # Cria o registro de pagamento
        payment_dict = {
            "order_id": payment_data.order_id,
            "payment_method": payment_data.payment_method,
            "status": "pending",
            "amount": order["total_amount"],
            "created_at": datetime.now(timezone.utc)
        }
        
        # Processa conforme o método
        if payment_data.payment_method == "pix":
            payment_dict["pix_qrcode"] = PaymentService.generate_pix_qrcode()
            payment_dict["status"] = "pending"  # PIX fica pendente até confirmação
            
        elif payment_data.payment_method in ["credit", "debit"]:
            # Valida dados do cartão
            if not payment_data.card_number or not payment_data.card_cvv or not payment_data.card_expiry:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Dados do cartão incompletos"
                )
            
            # Simula aprovação automática do cartão
            payment_dict["card_last_digits"] = payment_data.card_number[-4:]
            payment_dict["status"] = "confirmed"
            payment_dict["confirmed_at"] = datetime.now(timezone.utc)
            
            # Atualiza o pedido para pago
            await PaymentService.confirm_payment_and_add_hours(payment_data.order_id)
        
        # Salva o pagamento
        result = await db.payments.insert_one(payment_dict)
        payment_dict["_id"] = result.inserted_id
        
        return payment_dict
    
    @staticmethod
    async def confirm_payment_and_add_hours(order_id: str):
        """Confirma o pagamento e adiciona horas ao usuário"""
        db = get_database()
        
        if not ObjectId.is_valid(order_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do pedido inválido"
            )
        
        # Busca o pedido
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido não encontrado"
            )
        
        if order["status"] == "paid":
            return {"message": "Pedido já foi confirmado"}
        
        # Atualiza o status do pedido
        await db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {
                "$set": {
                    "status": "paid",
                    "paid_at": datetime.now(timezone.utc)
                }
            }
        )
        
        # Adiciona horas ao usuário
        await db.users.update_one(
            {"_id": ObjectId(order["user_id"])},
            {
                "$inc": {"hours_balance": order["voucher_hours"]},
                "$set": {"updated_at": datetime.now(timezone.utc)}
            }
        )
        
        # Atualiza o pagamento
        await db.payments.update_one(
            {"order_id": order_id},
            {
                "$set": {
                    "status": "confirmed",
                    "confirmed_at": datetime.now(timezone.utc)
                }
            }
        )
        
        return {
            "message": "Pagamento confirmado e horas adicionadas",
            "hours_added": order["voucher_hours"]
        }
    
    @staticmethod
    async def get_payment_by_order_id(order_id: str):
        """Busca um pagamento pelo ID do pedido"""
        db = get_database()
        payment = await db.payments.find_one({"order_id": order_id})
        return payment
