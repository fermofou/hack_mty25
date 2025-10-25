
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlmodel import select, or_

from config import get_session
from models.cliente import Cliente, ClienteCreate, ClienteRead, ClienteUpdate
from models.transacciones import Transaccion, TransaccionRead

router = APIRouter(prefix="/clientes", tags=["Clientes"])

# Signup endpoint para Cliente
from datetime import date
from pydantic import BaseModel

class ClienteSignup(BaseModel):
    nombre: str
    apellido: str
    username: str
    fecha_nacimiento: date
    pwd: str
    saldo: float = 0.0
    credit_score: float = None
    ciudad: str = None

@router.post("/signup", response_model=ClienteRead)
async def cliente_signup(cliente_in: ClienteSignup, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Cliente).where(Cliente.username == cliente_in.username))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    # Calcular edad
    today = date.today()
    edad = today.year - cliente_in.fecha_nacimiento.year - ((today.month, today.day) < (cliente_in.fecha_nacimiento.month, cliente_in.fecha_nacimiento.day))
    cliente_data = cliente_in.dict()
    cliente_data["edad"] = edad
    db_cliente = Cliente(**cliente_data)
    session.add(db_cliente)
    await session.commit()
    await session.refresh(db_cliente)
    return db_cliente

# Login endpoint para Cliente
@router.post("/login", response_model=ClienteRead)
async def cliente_login(username: str, pwd: str, session: AsyncSession = Depends(get_session)):
    statement = select(Cliente).where(Cliente.username == username, Cliente.pwd == pwd)
    result = await session.execute(statement)
    cliente = result.scalar_one_or_none()
    if not cliente:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    return cliente

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


# Endpoint para obtener todas las transacciones de un cliente
@router.get("/{cliente_id}/transacciones", response_model=List[TransaccionRead])
async def get_transacciones_cliente(cliente_id: int, session: AsyncSession = Depends(get_session)):
    """Devuelve todas las transacciones correspondientes a un cliente específico."""
    statement = select(Transaccion).where(Transaccion.cliente_id == cliente_id)
    result = await session.execute(statement)
    transacciones = result.scalars().all()
    return transacciones
