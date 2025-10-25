from fastapi import FastAPI
from routers.cliente import router as cliente_router
from routers.item import router as item_router
from routers.admin import router as admin_router
from routers.credito import router as credito_router
from routers.transacciones import router as transaccion_router
from routers.productos import router as productos_router
from routers.gemini import router as gemini_router

app = FastAPI(
    title="API de Créditos Verdes",
    description="CRUD completo para finanzas sustentables"
)

app.include_router(cliente_router)
app.include_router(item_router)
app.include_router(admin_router)
app.include_router(credito_router)
app.include_router(transaccion_router)
app.include_router(productos_router)
app.include_router(gemini_router)
