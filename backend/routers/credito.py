from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlmodel import select
import random

from models.gemini import CreditOffers, ProductData, CreditOffer
from config import get_session
from models.credito import (
    Credito,
    CreditoCreate,
    CreditoRead,
    CreditoUpdate,
    CreditoConNombreCliente,
)
from models.item import Item
from models.cliente import Cliente, ClienteRead
from models.transacciones import Transaccion
from pydantic import BaseModel

# Import from gemini module
from gemini.chatUtils import create_credit_offers

router = APIRouter(prefix="/creditos", tags=["Creditos"])


# Endpoint para pagar parte de un crédito
class PagoCreditoRequest(BaseModel):
    credito_id: int
    cliente_id: int
    monto: float


@router.post("/pagar")
async def pagar_credito(
    pago: PagoCreditoRequest, session: AsyncSession = Depends(get_session)
):
    """
    Permite a un cliente pagar parte de un crédito.
    Valida que el cliente tenga saldo suficiente y que no pague más de lo que debe.
    Devuelve el crédito y el cliente actualizados.
    """
    print("1")
    # Obtener crédito
    credito = await session.get(Credito, pago.credito_id)
    if not credito or credito.cliente_id != pago.cliente_id:
        raise HTTPException(
            status_code=404, detail="Crédito no encontrado para este cliente"
        )
    # Obtener cliente
    cliente = await session.get(Cliente, pago.cliente_id)
    if not cliente:
        print("2")
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    # Validar monto
    print("3")
    if pago.monto <= 0:
        print("4")
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a cero")
    if cliente.saldo < pago.monto:
        print("5")
        raise HTTPException(status_code=400, detail="Fondos insuficientes")
    print("6")
    monto_restante = credito.prestamo - credito.pagado
    if pago.monto > monto_restante:
        print("7")
        raise HTTPException(
            status_code=400, detail="No puedes pagar más de lo que debes del crédito"
        )
    # Realizar pago
    print("8")
    # Usar SQL directo para evitar deadlocks ORM
    from sqlalchemy import update

    print("9")
    await session.execute(
        update(Cliente)
        .where(Cliente.id == pago.cliente_id)
        .values(saldo=cliente.saldo - pago.monto)
    )
    await session.execute(
        update(Credito)
        .where(Credito.id_cred == pago.credito_id)
        .values(pagado=credito.pagado + pago.monto)
    )
    print("10")


    # Crear transacción de pago con fecha actual
    from datetime import datetime
    nueva_transaccion = Transaccion(
        cliente_id=pago.cliente_id,
        monto=pago.monto,
        categoria="Credito Verde",
        descripcion=f"Pago realizado al crédito #{pago.credito_id}",
        fecha=datetime.utcnow(),
    )
    session.add(nueva_transaccion)

    await session.commit()
    print("11")
    # Refrescar desde base de datos
    cliente = await session.get(Cliente, pago.cliente_id)
    credito = await session.get(Credito, pago.credito_id)
    print("12")
    return {
        "credito": CreditoRead.model_validate(credito).model_dump(),
        "cliente": ClienteRead.model_validate(cliente).model_dump(),
    }


@router.post("/", response_model=CreditoRead, tags=["Creditos"])
async def create_credito(
    credito_in: CreditoCreate, session: AsyncSession = Depends(get_session)
):
    """Crea un nuevo crédito verde."""
    # Valida que el cliente exista
    cliente = await session.get(Cliente, credito_in.cliente_id)
    if not cliente:
        raise HTTPException(
            status_code=404,
            detail=f"No se puede crear crédito: Cliente con id {credito_in.cliente_id} no existe.",
        )

    # Valida que el item exista (si se proporciona)
    if credito_in.item_id:
        item = await session.get(Item, credito_in.item_id)
        if not item:
            raise HTTPException(
                status_code=404,
                detail=f"No se puede crear crédito: Item con id {credito_in.item_id} no existe.",
            )

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


@router.get("/todos", response_model=List[CreditoConNombreCliente], tags=["Creditos"])
async def get_all_creditos_with_client_info(
    skip: int = 0, limit: int = 100, session: AsyncSession = Depends(get_session)
):
    """
    Obtiene todos los créditos con información del cmeliente (nombre, apellido, credit_score).
    Hace JOIN entre la tabla creditos y clientes usando cliente_id.
    """
    # Query con JOIN entre Credito y Cliente, ordenado por fecha_inicio descendente
    statement = (
        select(Credito, Cliente.nombre, Cliente.apellido, Cliente.credit_score)
        .join(Cliente, Credito.cliente_id == Cliente.id)
        .order_by(Credito.fecha_inicio.desc())
        .offset(skip)
        .limit(limit)
    )

    result = await session.execute(statement)
    rows = result.all()

    # Construir la respuesta usando el modelo CreditoConNombreCliente
    creditos_con_info = []
    for row in rows:
        credito = row[0]  # El objeto Credito
        nombre = row[1]  # Cliente.nombre
        apellido = row[2]  # Cliente.apellido
        credit_score = row[3]  # Cliente.credit_score

        credito_con_info = CreditoConNombreCliente(
            credito=CreditoRead.model_validate(credito),
            cliente_nombre=nombre,
            cliente_apellido=apellido,
            cliente_credit_score=credit_score or 0.0,  # Default 0.0 si es None
        )
        creditos_con_info.append(credito_con_info)

    return creditos_con_info


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


# TODO: Fix real data here
temporary_preapproved_items = [
    {
        "nombre": "Kit de Paneles Solares 5kW Monocristalinos",
        "link": "https://www.mercadolibre.com.mx/kit-panel-solar-5kw",
        "img_link": "https://evans.com.mx/media/catalog/product/cache/2210af2af20a4d3cb052fe59323561a1/S/i/Sistemas_Interconectados_EVANS_GEN_SOL5KW2X8_1L.jpg",
        "precio": 120000.0,
        "category": "Luz",
    },
    {
        "nombre": "Auto Eléctrico BYD Dolphin 2024",
        "link": "https://www.mercadolibre.com.mx/auto-electrico-byd-dolphin",
        "img_link": "https://acnews.blob.core.windows.net/imgnews/medium/NAZ_2384e31a6daa4a76b2be47cd2967fa5d.webp",
        "precio": 398000.0,
        "category": "Transporte",
    },
]


async def generate_preapproved_credit(
    cliente_id: int, session: AsyncSession
) -> CreditOffers:
    """
    Generates pre-approved credit offers for the user based on how many they already have:
    - If they have 0 pre-approved credits: generate 2 new offers
    - If they have 1 pre-approved credit: generate 1 new offer
    - If they have 2+ pre-approved credits: do not generate new offers (return error)

    30 minutes rate limiting is checked on frontend!

    These offers only use one of previously defined products in the database, such as solar panels or electric cars.

    Uses Gemini to generate the credit offer based on temporary_preapproved_items.
    """

    # Get user data
    user = await session.get(Cliente, cliente_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check existing pre-approved credits (estado="APROBADO")
    statement = select(Credito).where(
        Credito.cliente_id == cliente_id, Credito.estado == "APROBADO"
    )
    result = await session.execute(statement)
    existing_preapproved = result.scalars().all()
    num_existing = len(existing_preapproved)

    # Determine how many new offers to generate
    if num_existing >= 2:
        return CreditOffers(creditOffers=[])
    elif num_existing == 1:
        num_offers_to_generate = 1
    else:  # num_existing == 0
        num_offers_to_generate = 2

    # Get user transactions
    statement = select(Transaccion).where(Transaccion.cliente_id == cliente_id)
    result = await session.execute(statement)
    transacciones = result.scalars().all()

    if transacciones:
        trans_list = [
            f"ID: {t.id}, Amount: {t.monto}, Category: {t.categoria}, Description: {t.descripcion}, Date: {t.fecha}"
            for t in transacciones
        ]
        transacciones_str = "\n".join(trans_list)
    else:
        transacciones_str = "No transactions recorded."

    # Select random products from temporary_preapproved_items (without replacement)
    # Ensure we don't try to select more products than available
    num_products_to_select = min(
        num_offers_to_generate, len(temporary_preapproved_items)
    )
    selected_products = random.sample(
        temporary_preapproved_items, num_products_to_select
    )

    # Format product information
    products_info = []
    for i, product in enumerate(selected_products, 1):
        product_str = f"""
    Product {i}:
    - Name: {product["nombre"]}
    - Price: {product["precio"]} MXN
    - Category: {product["category"]}
    - Link: {product["link"]}
    - Image: {product["img_link"]}
    """
        products_info.append(product_str)

    all_products_str = "\n".join(products_info)

    # Build conversation context for Gemini
    user_info = f"Name: {user.nombre}, Last name: {user.apellido}, Username: {user.username}, Age: {user.edad}, Birth date: {user.fecha_nacimiento}, Balance: {user.saldo}, Credit Score: {user.credit_score}, City: {user.ciudad}"

    conversation_context = f"""
    Here is the user's data: {user_info}
    
    These are their transactions: {transacciones_str}
    
    {all_products_str}
    
    Generate {num_offers_to_generate} pre-approved credit offer(s) for the product(s) listed above. Each offer should be tailored to the user's financial situation and transaction history. Use one offer per product.
    """

    # Use Gemini to generate credit offers
    credit_offers = create_credit_offers(
        conversation_context, num_offers=num_offers_to_generate
    )

    return credit_offers


# Response models for the new endpoints
class PreapprovedContextResponse(BaseModel):
    conversation_context: str
    num_offers_to_generate: int


class GenerateCreditOffersRequest(BaseModel):
    conversation_context: str
    num_offers_to_generate: int


class SaveCreditOffersRequest(BaseModel):
    cliente_id: int
    credit_offers: CreditOffers


@router.post(
    "/preapproved/{cliente_id}/context", response_model=PreapprovedContextResponse
)
async def get_preapproved_context(
    cliente_id: int, session: AsyncSession = Depends(get_session)
):
    """
    Step 1: Generate conversation context for pre-approved credit offers.
    Returns the context needed for Gemini and the number of offers to generate.

    Determines based on existing pre-approved credits:
    - 2 credit offers if the user has 0 pre-approved credits
    - 1 credit offer if the user has 1 pre-approved credit
    - Error if the user already has 2+ pre-approved credits
    """
    # Get user data
    user = await session.get(Cliente, cliente_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check existing pre-approved credits (estado="APROBADO")
    statement = select(Credito).where(
        Credito.cliente_id == cliente_id,
        Credito.estado == "APROBADO",
        Credito.oferta,
    )
    result = await session.execute(statement)
    existing_preapproved = result.scalars().all()
    num_existing = len(existing_preapproved)

    # Determine how many new offers to generate
    if num_existing >= 2:
        return PreapprovedContextResponse(
            conversation_context="",
            num_offers_to_generate=0,
        )
    elif num_existing == 1:
        num_offers_to_generate = 1
    else:  # num_existing == 0
        num_offers_to_generate = 2

    # Get user transactions
    statement = select(Transaccion).where(Transaccion.cliente_id == cliente_id)
    result = await session.execute(statement)
    transacciones = result.scalars().all()

    if transacciones:
        trans_list = [
            f"ID: {t.id}, Amount: {t.monto}, Category: {t.categoria}, Description: {t.descripcion}, Date: {t.fecha}"
            for t in transacciones
        ]
        transacciones_str = "\n".join(trans_list)
    else:
        transacciones_str = "No transactions recorded."

    # Select random products from temporary_preapproved_items (without replacement)
    num_products_to_select = min(
        num_offers_to_generate, len(temporary_preapproved_items)
    )
    selected_products = random.sample(
        temporary_preapproved_items, num_products_to_select
    )

    # Format product information
    products_info = []
    for i, product in enumerate(selected_products, 1):
        product_str = f"""
    Product {i}:
    - Name: {product["nombre"]}
    - Price: {product["precio"]} MXN
    - Category: {product["category"]}
    - Link: {product["link"]}
    - Image: {product["img_link"]}
    """
        products_info.append(product_str)

    all_products_str = "\n".join(products_info)

    # Build conversation context for Gemini
    user_info = f"Name: {user.nombre}, Last name: {user.apellido}, Username: {user.username}, Age: {user.edad}, Birth date: {user.fecha_nacimiento}, Balance: {user.saldo}, Credit Score: {user.credit_score}, City: {user.ciudad}"

    conversation_context = f"""
    Here is the user's data: {user_info}
    
    These are their transactions: {transacciones_str}
    
    {all_products_str}
    
    Generate {num_offers_to_generate} pre-approved credit offer(s) for the product(s) listed above. Each offer should be tailored to the user's financial situation and transaction history. Use one offer per product.
    """

    return PreapprovedContextResponse(
        conversation_context=conversation_context,
        num_offers_to_generate=num_offers_to_generate,
    )


@router.post("/preapproved/generate", response_model=CreditOffers)
async def generate_credit_offers_endpoint(request: GenerateCreditOffersRequest):
    """
    Step 2: Generate credit offers using Gemini AI.
    Takes the conversation context and number of offers to generate,
    and returns the AI-generated credit offers.
    """
    credit_offers = create_credit_offers(
        request.conversation_context, num_offers=request.num_offers_to_generate
    )

    return credit_offers


@router.post("/preapproved/save", response_model=dict)
async def save_preapproved_credits(
    request: SaveCreditOffersRequest, session: AsyncSession = Depends(get_session)
):
    """
    Step 3: Save the generated credit offers to the database.
    Creates Item records if needed and stores Credito records with estado="APROBADO".
    """
    # Verify user exists
    user = await session.get(Cliente, request.cliente_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    created_credits = []

    # Store each generated offer in the database
    for offer in request.credit_offers.creditOffers:
        # First, create or find the Item for this product
        product = offer.product

        # Try to find existing item with same name and price
        item_statement = select(Item).where(
            Item.nombre == product.nombre, Item.precio == product.precio
        )
        item_result = await session.execute(item_statement)
        existing_item = item_result.scalar_one_or_none()

        if existing_item:
            item_id = existing_item.id
        else:
            # Create new item
            new_item = Item(
                nombre=product.nombre,
                precio=product.precio,
                link=product.link,
                img_link=product.img_link,
                categoria=product.categoria,
            )
            session.add(new_item)
            await session.flush()  # Flush to get the ID
            item_id = new_item.id

        # Create a new Credito record with estado="APROBADO"
        new_credito = Credito(
            cliente_id=request.cliente_id,
            prestamo=offer.prestamo,
            interes=offer.interes,
            meses_originales=offer.meses_originales,
            deuda_acumulada=0.0,
            pagado=0.0,
            categoria=product.categoria,
            estado="APROBADO",
            descripcion=offer.descripcion,
            gasto_inicial_mes=offer.gasto_inicial_mes,
            gasto_final_mes=offer.gasto_final_mes,
            item_id=item_id,
            oferta=True,
        )
        session.add(new_credito)
        await session.flush()
        created_credits.append(new_credito.id_cred)

    await session.commit()

    return {
        "message": "Credit offers saved successfully",
        "created_credit_ids": created_credits,
    }


@router.post("/preapproved/{cliente_id}", response_model=CreditOffers)
async def get_preapproved_credit_endpoint(
    cliente_id: int, session: AsyncSession = Depends(get_session)
):
    """
    Fetches all pre-approved credit offers for a specific client.
    Returns credits with estado="APROBADO" and oferta=True.
    """
    # Verify user exists
    user = await session.get(Cliente, cliente_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch pre-approved credits with their associated items
    statement = (
        select(Credito, Item)
        .join(Item, Credito.item_id == Item.id)
        .where(
            Credito.cliente_id == cliente_id,
            Credito.estado == "APROBADO",
            Credito.oferta,
        )
    )
    result = await session.execute(statement)
    rows = result.all()

    # Transform database records to CreditOffer objects
    credit_offers_list = []
    for row in rows:
        credito = row[0]  # Credito object
        item = row[1]  # Item object

        # Create ProductData from Item
        product_data = ProductData(
            nombre=item.nombre,
            link=item.link or "",
            img_link=item.img_link or "",
            precio=item.precio,
            categoria=item.categoria or "",
        )

        # Create CreditOffer
        credit_offer = CreditOffer(
            prestamo=credito.prestamo,
            interes=credito.interes,
            meses_originales=credito.meses_originales,
            descripcion=credito.descripcion or "",
            gasto_inicial_mes=credito.gasto_inicial_mes or 0.0,
            gasto_final_mes=credito.gasto_final_mes or 0.0,
            product=product_data,
        )
        credit_offers_list.append(credit_offer)

    return CreditOffers(creditOffers=credit_offers_list)
