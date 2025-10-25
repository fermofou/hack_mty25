from typing import List, Optional
from datetime import date
from sqlmodel import SQLModel, Field, Relationship

class ItemBase(SQLModel):
    nombre: str
    precio: float
    link: Optional[str] = None
    img_link: Optional[str] = None
    categoria: Optional[str] = None

class Item(ItemBase, table=True):
    __tablename__ = "items"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Relación: Un item puede estar en muchos créditos
    creditos: List["Credito"] = Relationship(back_populates="item")

class ItemCreate(ItemBase):
    pass

class ItemRead(ItemBase):
    id: int

class ItemUpdate(SQLModel):
    nombre: Optional[str] = None
    precio: Optional[float] = None
    link: Optional[str] = None
    img_link: Optional[str] = None
    categoria: Optional[str] = None