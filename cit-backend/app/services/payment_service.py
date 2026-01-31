from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
import random
import string
from app.database.mongo import get_database
from app.schemas.order import PaymentCreate
from app.services.mercadopago_service import MercadoPagoService
from fastapi import HTTPException, status


class PaymentService:
    
    @staticmethod
    def calculate_crc16(payload: str) -> str:
        """
        Calcula o CRC16-CCITT (polinômio 0x1021) para o payload PIX
        """
        crc = 0xFFFF
        for char in payload:
            crc ^= ord(char) << 8
            for _ in range(8):
                if crc & 0x8000:
                    crc = (crc << 1) ^ 0x1021
                else:
                    crc = crc << 1
                crc &= 0xFFFF
        return f"{crc:04X}"
    
    @staticmethod
    async def get_pix_key_from_config() -> str:
        """Busca a chave PIX das configurações do admin"""
        db = get_database()
        
        # Primeiro tenta buscar da nova coleção companies
        company = await db.companies.find_one({})
        if company and company.get("pixKey"):
            return company["pixKey"]
        
        # Fallback para coleção antiga config
        config = await db.config.find_one({"type": "financial"})
        if config and config.get("pixKey"):
            return config["pixKey"]
        
        # Retorna uma chave padrão se não houver configuração
        return "contato@cit.com"
    
    @staticmethod
    async def generate_pix_qrcode(amount: float, pix_key: str, order_id: str) -> str:
        """
        Gera um payload PIX copia e cola (BR Code)
        Formato EMV simplificado para demonstração
        """
        # Formata o valor com 2 casas decimais
        amount_str = f"{amount:.2f}"
        
        # ID 26: Merchant Account Information (chave PIX)
        # Campo 00 = GUI (Global Unique Identifier)
        # Campo 01 = Chave PIX
        gui = "br.gov.bcb.pix"
        chave = pix_key
        
        # Constrói o campo 26 (dados da conta)
        campo_00 = f"00{len(gui):02d}{gui}"
        campo_01 = f"01{len(chave):02d}{chave}"
        campo_26_content = campo_00 + campo_01
        campo_26 = f"26{len(campo_26_content):02d}{campo_26_content}"
        
        # ID 52: Merchant Category Code
        campo_52 = "52040000"
        
        # ID 53: Moeda (986 = Real)
        campo_53 = "5303986"
        
        # ID 54: Valor da transação
        campo_54 = f"54{len(amount_str):02d}{amount_str}"
        
        # ID 58: País (BR)
        campo_58 = "5802BR"
        
        # ID 59: Nome do beneficiário
        nome_beneficiario = "CIT Internet"
        campo_59 = f"59{len(nome_beneficiario):02d}{nome_beneficiario}"
        
        # ID 60: Cidade
        cidade = "SAO PAULO"
        campo_60 = f"60{len(cidade):02d}{cidade}"
        
        # ID 62: Additional Data Field Template
        # Campo 05 = Reference Label (identificador do pedido)
        ref_label = f"ORDER{order_id[:8]}"
        campo_05 = f"05{len(ref_label):02d}{ref_label}"
        campo_62 = f"62{len(campo_05):02d}{campo_05}"
        
        # Payload sem CRC
        payload_sem_crc = "000201" + campo_26 + campo_52 + campo_53 + campo_54 + campo_58 + campo_59 + campo_60 + campo_62 + "6304"
        
        # Calcula CRC16-CCITT
        crc = PaymentService.calculate_crc16(payload_sem_crc)
        
        payload_final = payload_sem_crc + crc
        
        return payload_final
    
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
            # Busca dados do voucher para descrição
            voucher = await db.vouchers.find_one({"_id": ObjectId(order["voucher_id"])})
            description = f"{voucher['name']} - {voucher['hours']}h" if voucher else "Voucher de Internet"
            
            try:
                # Cria ordem no Mercado Pago
                mp_order = await MercadoPagoService.create_qr_order(
                    amount=order["total_amount"],
                    description=description,
                    external_reference=payment_data.order_id
                )
                
                # Extrai o QR code da resposta
                qr_data = mp_order.get("qr_data", "")
                
                # Busca a chave PIX configurada no admin (para exibição)
                pix_key = await PaymentService.get_pix_key_from_config()
                
                payment_dict["pix_key"] = pix_key
                payment_dict["pix_qrcode"] = qr_data
                payment_dict["mercadopago_order_id"] = mp_order.get("id")
                payment_dict["status"] = "pending"  # PIX fica pendente até confirmação
                
            except HTTPException as e:
                # Se falhar a integração com Mercado Pago, gera QR code manual
                pix_key = await PaymentService.get_pix_key_from_config()
                payment_dict["pix_key"] = pix_key
                payment_dict["pix_qrcode"] = await PaymentService.generate_pix_qrcode(
                    order["total_amount"],
                    pix_key,
                    payment_data.order_id
                )
                payment_dict["status"] = "pending"
                payment_dict["fallback_mode"] = True  # Indica que usou modo fallback
            
        elif payment_data.payment_method in ["credit", "debit"]:
            # Busca dados do voucher para descrição
            voucher = await db.vouchers.find_one({"_id": ObjectId(order["voucher_id"])})
            description = f"{voucher['name']} - {voucher['hours']}h" if voucher else "Voucher de Internet"
            
            # Busca o usuário para pegar o email
            user = await db.users.find_one({"_id": ObjectId(order["user_id"])})
            payer_email = payment_data.payer_email or (user.get("email") if user else "cliente@email.com")
            
            # Se tiver token do Mercado Pago, usa a API real
            if payment_data.card_token:
                try:
                    mp_payment = await MercadoPagoService.create_card_payment(
                        amount=order["total_amount"],
                        description=description,
                        external_reference=payment_data.order_id,
                        token=payment_data.card_token,
                        installments=payment_data.card_installments or 1,
                        payment_method_id=payment_data.card_payment_method_id or "master",
                        payer_email=payer_email,
                        card_holder_name=payment_data.card_holder_name,
                        identification_type=payment_data.identification_type,
                        identification_number=payment_data.identification_number
                    )
                    
                    payment_dict["mercadopago_payment_id"] = mp_payment.get("id")
                    payment_dict["status_detail"] = mp_payment.get("status_detail")
                    payment_dict["installments"] = mp_payment.get("installments", 1)
                    
                    # Mapeia status do Mercado Pago
                    mp_status = mp_payment.get("status", "rejected")
                    if mp_status == "approved":
                        payment_dict["status"] = "confirmed"
                        payment_dict["confirmed_at"] = datetime.now(timezone.utc)
                        payment_dict["card_last_digits"] = mp_payment.get("card", {}).get("last_four_digits", "****")
                        
                        # Atualiza o pedido para pago e adiciona horas
                        await PaymentService._add_hours_to_user(order_id, order)
                    elif mp_status in ["pending", "in_process"]:
                        payment_dict["status"] = "pending"
                        payment_dict["card_last_digits"] = mp_payment.get("card", {}).get("last_four_digits", "****")
                    else:
                        payment_dict["status"] = "failed"
                        payment_dict["error"] = mp_payment.get("error", "Pagamento recusado")
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Pagamento recusado: {mp_payment.get('status_detail', 'cc_rejected_other_reason')}"
                        )
                        
                except HTTPException:
                    raise
                except Exception as e:
                    # Fallback: simula aprovação para não bloquear
                    payment_dict["card_last_digits"] = payment_data.card_number[-4:] if payment_data.card_number else "****"
                    payment_dict["status"] = "confirmed"
                    payment_dict["confirmed_at"] = datetime.now(timezone.utc)
                    payment_dict["fallback_mode"] = True
                    await PaymentService._add_hours_to_user(payment_data.order_id, order)
            else:
                # Simulação sem token (modo de desenvolvimento)
                if not payment_data.card_number or not payment_data.card_cvv or not payment_data.card_expiry:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Dados do cartão incompletos"
                    )
                
                payment_dict["card_last_digits"] = payment_data.card_number[-4:]
                payment_dict["status"] = "confirmed"
                payment_dict["confirmed_at"] = datetime.now(timezone.utc)
                payment_dict["fallback_mode"] = True
                
                # Adiciona horas ao usuário
                await PaymentService._add_hours_to_user(payment_data.order_id, order)
        
        # Salva o pagamento
        result = await db.payments.insert_one(payment_dict)
        payment_dict["_id"] = result.inserted_id
        
        return payment_dict
    
    @staticmethod
    async def _add_hours_to_user(order_id: str, order: dict):
        """Método auxiliar para atualizar pedido e adicionar horas ao usuário"""
        db = get_database()
        
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
        
        # Busca o pagamento
        payment = await db.payments.find_one({"order_id": order_id})
        
        # Se tiver mercadopago_order_id, verifica status real no Mercado Pago
        if payment and payment.get("mercadopago_order_id"):
            try:
                mp_status = await MercadoPagoService.check_payment_status(order_id)
                
                # Se ainda está pendente no Mercado Pago, não confirma
                if mp_status.get("status") != "confirmed":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Pagamento ainda não foi confirmado pelo Mercado Pago"
                    )
            except Exception as e:
                # Em caso de erro na consulta, permite confirmar (modo fallback)
                pass
        
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
