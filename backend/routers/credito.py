from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlmodel import select

from config import get_session
from models.credito import Credito, CreditoCreate, CreditoRead, CreditoUpdate
from models.item import Item
from models.cliente import Cliente

router = APIRouter(prefix="/creditos", tags=["Creditos"])

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