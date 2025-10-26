from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlmodel import select

from models.gemini import CreditOffers
from config import get_session
from models.credito import Credito, CreditoCreate, CreditoRead, CreditoUpdate, CreditoConNombreCliente
from models.item import Item
from models.cliente import Cliente, ClienteRead
from pydantic import BaseModel

router = APIRouter(prefix="/creditos", tags=["Creditos"])


# Endpoint para pagar parte de un crédito
class PagoCreditoRequest(BaseModel):
    credito_id: int
    cliente_id: int
    monto: float


@router.post("/pagar")
async def pagar_credito(
    pago: PagoCreditoRequest, session: AsyncSession = Depends(get_session)
):
    """
    Permite a un cliente pagar parte de un crédito.
    Valida que el cliente tenga saldo suficiente y que no pague más de lo que debe.
    Devuelve el crédito y el cliente actualizados.
    """
    print("1")
    # Obtener crédito
    credito = await session.get(Credito, pago.credito_id)
    if not credito or credito.cliente_id != pago.cliente_id:
        raise HTTPException(
            status_code=404, detail="Crédito no encontrado para este cliente"
        )
    # Obtener cliente
    cliente = await session.get(Cliente, pago.cliente_id)
    if not cliente:
        print("2")
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    # Validar monto
    print("3")
    if pago.monto <= 0:
        print("4")
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a cero")
    if cliente.saldo < pago.monto:
        print("5")
        raise HTTPException(status_code=400, detail="Fondos insuficientes")
    print("6")
    monto_restante = credito.prestamo - credito.pagado
    if pago.monto > monto_restante:
        print("7")
        raise HTTPException(
            status_code=400, detail="No puedes pagar más de lo que debes del crédito"
        )
    # Realizar pago
    print("8")
    # Usar SQL directo para evitar deadlocks ORM
    from sqlalchemy import update

    print("9")
    await session.execute(
        update(Cliente)
        .where(Cliente.id == pago.cliente_id)
        .values(saldo=cliente.saldo - pago.monto)
    )
    await session.execute(
        update(Credito)
        .where(Credito.id_cred == pago.credito_id)
        .values(pagado=credito.pagado + pago.monto)
    )
    print("10")
    await session.commit()
    print("11")
    # Refrescar desde base de datos
    cliente = await session.get(Cliente, pago.cliente_id)
    credito = await session.get(Credito, pago.credito_id)
    print("12")
    return {
        "credito": CreditoRead.model_validate(credito).model_dump(),
        "cliente": ClienteRead.model_validate(cliente).model_dump(),
    }


@router.post("/", response_model=CreditoRead, tags=["Creditos"])
async def create_credito(
    credito_in: CreditoCreate, session: AsyncSession = Depends(get_session)
):
    """Crea un nuevo crédito verde."""
    # Valida que el cliente exista
    cliente = await session.get(Cliente, credito_in.cliente_id)
    if not cliente:
        raise HTTPException(
            status_code=404,
            detail=f"No se puede crear crédito: Cliente con id {credito_in.cliente_id} no existe.",
        )

    # Valida que el item exista (si se proporciona)
    if credito_in.item_id:
        item = await session.get(Item, credito_in.item_id)
        if not item:
            raise HTTPException(
                status_code=404,
                detail=f"No se puede crear crédito: Item con id {credito_in.item_id} no existe.",
            )

    db_credito = Credito.from_orm(credito_in)
    session.add(db_credito)
    await session.commit()
    await session.refresh(db_credito)
    return db_credito


@router.get("/", response_model=List[CreditoRead], tags=["Creditos"])
async def read_creditos(
    skip: int = 0, limit: int = 100, session: AsyncSession = Depends(get_session)
):
    """Lee una lista de créditos."""
    statement = select(Credito).offset(skip).limit(limit)
    result = await session.execute(statement)
    creditos = result.scalars().all()
    return creditos


@router.get("/todos", response_model=List[CreditoConNombreCliente], tags=["Creditos"])
async def get_all_creditos_with_client_info(
    skip: int = 0, 
    limit: int = 100, 
    session: AsyncSession = Depends(get_session)
):
    """
    Obtiene todos los créditos con información del cliente (nombre, apellido, credit_score).
    Hace JOIN entre la tabla creditos y clientes usando cliente_id.
    """
    # Query con JOIN entre Credito y Cliente, ordenado por fecha_inicio descendente
    statement = (
        select(Credito, Cliente.nombre, Cliente.apellido, Cliente.credit_score)
        .join(Cliente, Credito.cliente_id == Cliente.id)
        .order_by(Credito.fecha_inicio.desc())
        .offset(skip)
        .limit(limit)
    )
    
    result = await session.execute(statement)
    rows = result.all()
    
    # Construir la respuesta usando el modelo CreditoConNombreCliente
    creditos_con_info = []
    for row in rows:
        credito = row[0]  # El objeto Credito
        nombre = row[1]   # Cliente.nombre
        apellido = row[2] # Cliente.apellido
        credit_score = row[3] # Cliente.credit_score
        
        credito_con_info = CreditoConNombreCliente(
            credito=CreditoRead.model_validate(credito),
            cliente_nombre=nombre,
            cliente_apellido=apellido,
            cliente_credit_score=credit_score or 0.0  # Default 0.0 si es None
        )
        creditos_con_info.append(credito_con_info)
    
    return creditos_con_info


@router.get("/{credito_id}", response_model=CreditoRead, tags=["Creditos"])
async def read_credito(credito_id: int, session: AsyncSession = Depends(get_session)):
    """Lee un crédito específico por ID (id_cred)."""
    db_credito = await session.get(Credito, credito_id)
    if not db_credito:
        raise HTTPException(status_code=404, detail="Credito no encontrado")
    return db_credito


@router.patch("/{credito_id}", response_model=CreditoRead, tags=["Creditos"])
async def update_credito(
    credito_id: int,
    credito_in: CreditoUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Actualiza un crédito."""
    db_credito = await session.get(Credito, credito_id)
    if not db_credito:
        raise HTTPException(status_code=404, detail="Credito no encontrado")

    update_data = credito_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_credito, key, value)

    session.add(db_credito)
    await session.commit()
    await session.refresh(db_credito)
    return db_credito


@router.delete("/{credito_id}", tags=["Creditos"])
async def delete_credito(credito_id: int, session: AsyncSession = Depends(get_session)):
    """Elimina un crédito."""
    db_credito = await session.get(Credito, credito_id)
    if not db_credito:
        raise HTTPException(status_code=404, detail="Credito no encontrado")

    await session.delete(db_credito)
    await session.commit()
    return {"ok": True, "detail": "Credito eliminado"}


# TODO: Fix real data here
temporary_preapproved_items = [
    {
        "nombre": "Kit de Paneles Solares 5kW Monocristalinos",
        "link": "https://www.mercadolibre.com.mx/kit-panel-solar-5kw",
        "img_link": "https://evans.com.mx/media/catalog/product/cache/2210af2af20a4d3cb052fe59323561a1/S/i/Sistemas_Interconectados_EVANS_GEN_SOL5KW2X8_1L.jpg",
        "precio": 120000.0,
        "category": "Luz",
    },
    {
        "nombre": "Auto Eléctrico BYD Dolphin 2024",
        "link": "https://www.mercadolibre.com.mx/auto-electrico-byd-dolphin",
        "img_link": "https://acnews.blob.core.windows.net/imgnews/medium/NAZ_2384e31a6daa4a76b2be47cd2967fa5d.webp",
        "precio": 398000.0,
        "category": "Transporte",
    },
]


async def generate_preapproved_credit() -> CreditOffers:
    """
    Generates 1 possible pre-approved credit offer for the user ONLY IF:
    1. They are eligible based on their credit score and transaction history
    2. They do not already have a pre-approved credit offer
    3. 30 minutes have not passed since the last offer attempt was called (to avoid spamming). Checked on frontend!

    These offers only use one of previously defined products in the database, such as solar panels or electric cars.
    """
