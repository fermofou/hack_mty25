from typing import List, Optional
from datetime import date
from sqlmodel import SQLModel, Field, Relationship

class ClienteBase(SQLModel):
    nombre: str
    apellido: str
    username: str = Field(unique=True, index=True)
    edad: Optional[int] = Field(default=None, gt=0)
    fecha_nacimiento: Optional[date] = None
    saldo: float = Field(default=0.0)
    credit_score: Optional[float] = Field(default=None, ge=0, le=1)
    ciudad: Optional[str] = None

class Cliente(ClienteBase, table=True):
    __tablename__ = "clientes"
    id: Optional[int] = Field(default=None, primary_key=True)
    pwd: str
    creditos: List["Credito"] = Relationship(back_populates="cliente")

class ClienteCreate(ClienteBase):
    pwd: str

class ClienteRead(ClienteBase):
    id: int

class ClienteUpdate(SQLModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    edad: Optional[int] = None
    fecha_nacimiento: Optional[date] = None
    saldo: Optional[float] = None
    credit_score: Optional[float] = None
    ciudad: Optional[str] = None
