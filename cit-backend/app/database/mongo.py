from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

client: AsyncIOMotorClient = None
database: AsyncIOMotorDatabase = None


async def connect_to_mongo():
    """Conecta ao MongoDB"""
    global client, database
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.DATABASE_NAME]
    print(f"✓ Conectado ao MongoDB: {settings.DATABASE_NAME}")


async def close_mongo_connection():
    """Fecha a conexão com o MongoDB"""
    global client
    if client:
        client.close()
        print("✓ Conexão com MongoDB fechada")


def get_database() -> AsyncIOMotorDatabase:
    """Retorna a instância do banco de dados"""
    return database
