from fastapi import APIRouter, Depends, HTTPException, status
from app.routes.auth import get_current_user
from app.schemas.order import PaymentCreate, PaymentResponse
from app.services.payment_service import PaymentService
from app.services.mercadopago_service import MercadoPagoService

router = APIRouter(prefix="/payment", tags=["Payment"])


@router.get("/mercadopago/public-key")
async def get_mercadopago_public_key():
    """Retorna a public key do Mercado Pago para o frontend"""
    public_key = MercadoPagoService.get_public_key()
    if not public_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Mercado Pago public key não configurada"
        )
    return {"public_key": public_key}


@router.post("/process", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def process_payment(
    payment_data: PaymentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Processa um pagamento"""
    payment = await PaymentService.process_payment(payment_data)
    
    return PaymentResponse(
        id=str(payment["_id"]),
        order_id=payment["order_id"],
        payment_method=payment["payment_method"],
        status=payment["status"],
        amount=payment["amount"],
        pix_qrcode=payment.get("pix_qrcode"),
        pix_key=payment.get("pix_key"),
        card_last_digits=payment.get("card_last_digits"),
        mercadopago_payment_id=str(payment.get("mercadopago_payment_id")) if payment.get("mercadopago_payment_id") else None,
        status_detail=payment.get("status_detail"),
        installments=payment.get("installments"),
        created_at=payment["created_at"].isoformat()
    )


@router.post("/confirm/{order_id}")
async def confirm_payment(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Confirma um pagamento PIX (simulação)"""
    result = await PaymentService.confirm_payment_and_add_hours(order_id)
    return result


@router.get("/status/{order_id}")
async def get_payment_status(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Verifica o status de um pagamento - Auto-confirma PIX pendente (simulação)"""
    payment = await PaymentService.get_payment_by_order_id(order_id)
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pagamento não encontrado"
        )
    
    # SIMULAÇÃO: Se for PIX pendente, confirma automaticamente
    if payment["payment_method"] == "pix" and payment["status"] == "pending":
        await PaymentService.confirm_payment_and_add_hours(order_id)
        # Recarrega o pagamento atualizado
        payment = await PaymentService.get_payment_by_order_id(order_id)
    
    return PaymentResponse(
        id=str(payment["_id"]),
        order_id=payment["order_id"],
        payment_method=payment["payment_method"],
        status=payment["status"],
        amount=payment["amount"],
        pix_qrcode=payment.get("pix_qrcode"),
        pix_key=payment.get("pix_key"),
        card_last_digits=payment.get("card_last_digits"),
        created_at=payment["created_at"].isoformat()
    )
