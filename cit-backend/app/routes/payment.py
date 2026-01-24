from fastapi import APIRouter, Depends, HTTPException, status
from app.routes.auth import get_current_user
from app.schemas.order import PaymentCreate, PaymentResponse
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payment", tags=["Payment"])


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
        card_last_digits=payment.get("card_last_digits"),
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
    """Verifica o status de um pagamento"""
    payment = await PaymentService.get_payment_by_order_id(order_id)
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pagamento não encontrado"
        )
    
    return PaymentResponse(
        id=str(payment["_id"]),
        order_id=payment["order_id"],
        payment_method=payment["payment_method"],
        status=payment["status"],
        amount=payment["amount"],
        pix_qrcode=payment.get("pix_qrcode"),
        card_last_digits=payment.get("card_last_digits"),
        created_at=payment["created_at"].isoformat()
    )
