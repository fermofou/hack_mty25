from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlmodel import select

from config import get_session
from models.item import Item, ItemCreate, ItemRead, ItemUpdate

router = APIRouter(prefix="/items", tags=["Items"])

@router.post("/", response_model=ItemRead)
async def create_item(item_in: ItemCreate, session: AsyncSession = Depends(get_session)):
    """Crea un nuevo item (producto verde)."""
    db_item = Item.from_orm(item_in)
    session.add(db_item)
    await session.commit()
    await session.refresh(db_item)
    return db_item

@router.get("/", response_model=List[ItemRead])
async def read_items(skip: int = 0, limit: int = 100, session: AsyncSession = Depends(get_session)):
    """Lee una lista de items."""
    statement = select(Item).offset(skip).limit(limit)
    result = await session.execute(statement)   # <-- use execute()
    items = result.scalars().all()              
    return items


@router.get("/{item_id}", response_model=ItemRead)
async def read_item(item_id: int, session: AsyncSession = Depends(get_session)):
    """Lee un item específico por ID."""
    db_item = await session.get(Item, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return db_item


@router.patch("/{item_id}", response_model=ItemRead)
async def update_item(
    item_id: int,
    item_in: ItemUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Actualiza un item."""
    db_item = await session.get(Item, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    update_data = item_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    
    session.add(db_item)
    await session.commit()
    await session.refresh(db_item)
    return db_item


@router.delete("/{item_id}", tags=["Items"])
async def delete_item(item_id: int, session: AsyncSession = Depends(get_session)):
    """Elimina un item."""
    db_item = await session.get(Item, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    await session.delete(db_item)
    await session.commit()
    return {"ok": True, "detail": "Item eliminado"}
