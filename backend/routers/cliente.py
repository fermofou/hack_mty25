from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlmodel import select

from config import get_session
from models.cliente import Cliente, ClienteCreate, ClienteRead, ClienteUpdate

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.post("/", response_model=ClienteRead)
async def create_cliente(cliente_in: ClienteCreate, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Cliente).where(Cliente.username == cliente_in.username))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    cliente_data = cliente_in.dict()
    db_cliente = Cliente(**cliente_data)
    session.add(db_cliente)
    await session.commit()
    await session.refresh(db_cliente)
    return db_cliente

@router.get("/", response_model=List[ClienteRead])
async def read_clientes(skip: int = 0, limit: int = 100, session: AsyncSession = Depends(get_session)):
    statement = select(Cliente).offset(skip).limit(limit)
    result = await session.execute(statement)
    return result.scalars().all()

@router.get("/{cliente_id}", response_model=ClienteRead)
async def read_cliente(cliente_id: int, session: AsyncSession = Depends(get_session)):
    db_cliente = await session.get(Cliente, cliente_id)
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_cliente

@router.patch("/{cliente_id}", response_model=ClienteRead)
async def update_cliente(cliente_id: int, cliente_in: ClienteUpdate, session: AsyncSession = Depends(get_session)):
    db_cliente = await session.get(Cliente, cliente_id)
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    update_data = cliente_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_cliente, key, value)
    session.add(db_cliente)
    await session.commit()
    await session.refresh(db_cliente)
    return db_cliente

@router.delete("/{cliente_id}")
async def delete_cliente(cliente_id: int, session: AsyncSession = Depends(get_session)):
    db_cliente = await session.get(Cliente, cliente_id)
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    await session.delete(db_cliente)
    await session.commit()
    return {"ok": True, "detail": "Cliente eliminado"}
