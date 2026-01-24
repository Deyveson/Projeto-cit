from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.mongo import connect_to_mongo, close_mongo_connection
from app.routes import auth, admin, client, payment
from app.services.voucher_service import VoucherService

app = FastAPI(
    title="CIT API",
    description="API para sistema de gerenciamento de vouchers e pagamentos",
    version="1.0.0"
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar domínios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Evento executado na inicialização da aplicação"""
    await connect_to_mongo()
    await VoucherService.initialize_default_vouchers()


@app.on_event("shutdown")
async def shutdown_event():
    """Evento executado no encerramento da aplicação"""
    await close_mongo_connection()


# Registrar rotas
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(client.router)
app.include_router(payment.router)


@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "message": "CIT API - Sistema de Gerenciamento de Vouchers",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
