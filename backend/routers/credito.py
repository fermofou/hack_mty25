
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlmodel import select

from config import get_session
from models.credito import Credito, CreditoCreate, CreditoRead, CreditoUpdate
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
async def pagar_credito(pago: PagoCreditoRequest, session: AsyncSession = Depends(get_session)):
    """
    Permite a un cliente pagar parte de un crédito.
    Valida que el cliente tenga saldo suficiente y que no pague más de lo que debe.
    Devuelve el crédito y el cliente actualizados.
    """
    print("1")
    # Obtener crédito
    credito = await session.get(Credito, pago.credito_id)
    if not credito or credito.cliente_id != pago.cliente_id:
        raise HTTPException(status_code=404, detail="Crédito no encontrado para este cliente")
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
        raise HTTPException(status_code=400, detail="No puedes pagar más de lo que debes del crédito")
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
        "cliente": ClienteRead.model_validate(cliente).model_dump()
    }

@router.post("/", response_model=CreditoRead, tags=["Creditos"])
async def create_credito(
    credito_in: CreditoCreate, session: AsyncSession = Depends(get_session)
):
    """Crea un nuevo crédito verde."""
    # Valida que el cliente exista
    cliente = await session.get(Cliente, credito_in.cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail=f"No se puede crear crédito: Cliente con id {credito_in.cliente_id} no existe.")

    # Valida que el item exista (si se proporciona)
    if credito_in.item_id:
        item = await session.get(Item, credito_in.item_id)
        if not item:
            raise HTTPException(status_code=404, detail=f"No se puede crear crédito: Item con id {credito_in.item_id} no existe.")

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