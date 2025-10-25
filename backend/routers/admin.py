from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlmodel import select

from config import get_session

from models.admin import Admin, AdminCreate, AdminRead, AdminUpdate

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/", response_model=AdminRead, tags=["Admins"])
async def create_admin(
    admin_in: AdminCreate, session: AsyncSession = Depends(get_session)
):
    """Crea un nuevo administrador."""
    
    admin_data = admin_in.dict()
    
    db_admin = Admin(**admin_data)
    
    session.add(db_admin)
    await session.commit()
    await session.refresh(db_admin)
    return db_admin


@router.get("/", response_model=List[AdminRead], tags=["Admins"])
async def read_admins(
    skip: int = 0, limit: int = 100, session: AsyncSession = Depends(get_session)
):
    """Lee una lista de administradores."""
    statement = select(Admin).offset(skip).limit(limit)
    result = await session.execute(statement)
    admins = result.scalars().all()
    return admins


@router.get("/{admin_id}", response_model=AdminRead, tags=["Admins"])
async def read_admin(admin_id: int, session: AsyncSession = Depends(get_session)):
    """Lee un admin específico por ID."""
    db_admin = await session.get(Admin, admin_id)
    if not db_admin:
        raise HTTPException(status_code=404, detail="Admin no encontrado")
    return db_admin


@router.patch("/{admin_id}", response_model=AdminRead, tags=["Admins"])
async def update_admin(
    admin_id: int,
    admin_in: AdminUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Actualiza un admin."""
    db_admin = await session.get(Admin, admin_id)
    if not db_admin:
        raise HTTPException(status_code=44, detail="Admin no encontrado")
    
    update_data = admin_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_admin, key, value)
    
    session.add(db_admin)
    await session.commit()
    await session.refresh(db_admin)
    return db_admin


@router.delete("/{admin_id}", tags=["Admins"])
async def delete_admin(admin_id: int, session: AsyncSession = Depends(get_session)):
    """Elimina un admin."""
    db_admin = await session.get(Admin, admin_id)
    if not db_admin:
        raise HTTPException(status_code=404, detail="Admin no encontrado")
    
    await session.delete(db_admin)
    await session.commit()
    return {"ok": True, "detail": "Admin eliminado"}

