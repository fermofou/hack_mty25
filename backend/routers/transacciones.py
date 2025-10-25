from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlmodel import select

from config import get_session
from models.transacciones import Transaccion, TransaccionCreate, TransaccionRead, TransaccionUpdate

router = APIRouter(prefix="/transacciones", tags=["Transacciones"])

@router.post("/", response_model=TransaccionRead)
async def create_transaccion(trans_in: TransaccionCreate, session: AsyncSession = Depends(get_session)):
    """Crea una nueva transacción."""
    db_trans = Transaccion.from_orm(trans_in)
    
    # Convertir fecha a naïve si viene con tzinfo
    if db_trans.fecha and db_trans.fecha.tzinfo:
        db_trans.fecha = db_trans.fecha.replace(tzinfo=None)
    
    session.add(db_trans)
    await session.commit()
    await session.refresh(db_trans)
    return db_trans


@router.get("/", response_model=List[TransaccionRead])
async def read_transacciones(skip: int = 0, limit: int = 100, session: AsyncSession = Depends(get_session)):
    """Lee una lista de transacciones."""
    statement = select(Transaccion).offset(skip).limit(limit)
    result = await session.execute(statement)
    transacciones = result.scalars().all()
    return transacciones

@router.get("/{transaccion_id}", response_model=TransaccionRead)
async def read_transaccion(transaccion_id: int, session: AsyncSession = Depends(get_session)):
    """Lee una transacción específica por ID."""
    db_transaccion = await session.get(Transaccion, transaccion_id)
    if not db_transaccion:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    return db_transaccion

@router.patch("/{transaccion_id}", response_model=TransaccionRead)
async def update_transaccion(
    transaccion_id: int,
    transaccion_in: TransaccionUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Actualiza una transacción."""
    db_transaccion = await session.get(Transaccion, transaccion_id)
    if not db_transaccion:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    
    update_data = transaccion_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_transaccion, key, value)
    
    session.add(db_transaccion)
    await session.commit()
    await session.refresh(db_transaccion)
    return db_transaccion

@router.delete("/{transaccion_id}", tags=["Transacciones"])
async def delete_transaccion(transaccion_id: int, session: AsyncSession = Depends(get_session)):
    """Elimina una transacción."""
    db_transaccion = await session.get(Transaccion, transaccion_id)
    if not db_transaccion:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    
    await session.delete(db_transaccion)
    await session.commit()
    return {"ok": True, "detail": "Transacción eliminada"}

@router.get("/cliente/{cliente_id}", response_model=List[TransaccionRead])
async def read_transacciones_cliente(cliente_id: int, session: AsyncSession = Depends(get_session)):
    """Obtiene todas las transacciones de un cliente específico."""
    statement = select(Transaccion).where(Transaccion.cliente_id == cliente_id)
    result = await session.execute(statement)
    transacciones = result.scalars().all()
    
    if not transacciones:
        raise HTTPException(status_code=404, detail="No se encontraron transacciones para este cliente")
    
    return transacciones
