from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlmodel import select

from config import get_session

from models.admin import Admin, AdminCreate, AdminRead, AdminUpdate
from models.credito import Credito, CreditoUpdate
from models.cliente import Cliente
from models.item import Item

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


# --- ENDPOINTS DE MANEJO DE CRÉDITOS PARA ADMIN ---
def validate_estado(estado: str):
    if estado not in ["APROBADO", "NEGADO"]:
        raise HTTPException(status_code=400, detail="Estado debe ser APROBADO o NEGADO")


# Endpoint general para cambiar estado
@router.patch("/manage_credits/cambiar-estado/{credito_id}")
async def cambiar_estado_credito(
    credito_id: int,
    nuevo_estado: str,
    session: AsyncSession = Depends(get_session)
):
    """Permite al admin cambiar el estado de un crédito a APROBADO o NEGADO."""
    validate_estado(nuevo_estado)
    credito = await session.get(Credito, credito_id)
    if not credito:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")
    credito.estado = nuevo_estado
    session.add(credito)
    await session.commit()
    await session.refresh(credito)
    return {"ok": True, "id_cred": credito.id_cred, "nuevo_estado": credito.estado}

# Endpoint para negar crédito
@router.patch("/manage_credits/negar/{credito_id}")
async def negar_credito(
    credito_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Permite al admin negar un crédito (estado=NEGADO)."""
    credito = await session.get(Credito, credito_id)
    if not credito:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")
    credito.estado = "NEGADO"
    session.add(credito)
    await session.commit()
    await session.refresh(credito)
    return {"ok": True, "id_cred": credito.id_cred, "nuevo_estado": credito.estado}

# Endpoint para aceptar crédito
@router.patch("/manage_credits/aceptar/{credito_id}")
async def aceptar_credito(
    credito_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Permite al admin aceptar un crédito (estado=APROBADO)."""
    credito = await session.get(Credito, credito_id)
    if not credito:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")
    credito.estado = "APROBADO"
    session.add(credito)
    await session.commit()
    await session.refresh(credito)
    return {"ok": True, "id_cred": credito.id_cred, "nuevo_estado": credito.estado}


def build_creditos_response(creditos, session):
    # Helper para armar la respuesta con info de cliente e item
    async def build():
        response = []
        for credito in creditos:
            cliente = await session.get(Cliente, credito.cliente_id)
            item = await session.get(Item, credito.item_id) if credito.item_id else None
            response.append({
                "credito": {
                    "prestamo": credito.prestamo,
                    "interes": credito.interes,
                    "meses_originales": credito.meses_originales,
                    "categoria": credito.categoria,
                    "descripcion": credito.descripcion,
                    "gasto_inicial_mes": credito.gasto_inicial_mes,
                    "gasto_final_mes": credito.gasto_final_mes
                },
                "cliente": {
                    "nombre": cliente.nombre,
                    "apellido": cliente.apellido,
                    "edad": cliente.edad,
                    "fecha_nacimiento": cliente.fecha_nacimiento,
                    "saldo": cliente.saldo,
                    "credit_score": cliente.credit_score
                } if cliente else None,
                "item": {
                    "nombre": item.nombre,
                    "link": item.link,
                    "img_link": item.img_link,
                    "precio": item.precio
                } if item else None
            })
        return response
    return build

@router.get("/manage_credits/pendientes")
async def creditos_pendientes(session: AsyncSession = Depends(get_session)):
    """Devuelve todos los créditos en estado PENDIENTE, con info de cliente e item relacionado."""
    statement = select(Credito).where(Credito.estado == "PENDIENTE")
    result = await session.execute(statement)
    creditos = result.scalars().all()
    return await build_creditos_response(creditos, session)()

@router.get("/manage_credits/aprovados")
async def creditos_aprovados(session: AsyncSession = Depends(get_session)):
    """Devuelve todos los créditos en estado APROBADO, con info de cliente e item relacionado."""
    statement = select(Credito).where(Credito.estado == "APROBADO")
    result = await session.execute(statement)
    creditos = result.scalars().all()
    return await build_creditos_response(creditos, session)()

@router.get("/manage_credits/negados")
async def creditos_negados(session: AsyncSession = Depends(get_session)):
    """Devuelve todos los créditos en estado NEGADO, con info de cliente e item relacionado."""
    statement = select(Credito).where(Credito.estado == "NEGADO")
    result = await session.execute(statement)
    creditos = result.scalars().all()
    return await build_creditos_response(creditos, session)()

