from typing import List, Optional
from datetime import date
from sqlmodel import SQLModel, Field, Relationship

class AdminBase(SQLModel):
    nombre: str
    apellido: str
    username: str = Field(unique=True)

class Admin(AdminBase, table=True):
    __tablename__ = "admin"
    
    # Tu schema usa id_admin, así que lo respetamos
    id_admin: Optional[int] = Field(default=None, primary_key=True)
    pwd: str

class AdminCreate(AdminBase):
    pwd: str # Al crear, pedimos la contraseña

class AdminRead(AdminBase):
    id_admin: int # Al leer, NO devolvemos la contraseña

class AdminUpdate(SQLModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None 
    pwd: Optional[str] = None
    username: Optional[str] = None
