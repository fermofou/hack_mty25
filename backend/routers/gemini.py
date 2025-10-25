from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from config import get_session
from models.cliente import Cliente
from models.transacciones import Transaccion
from models.gemini import GeminiRequest

# Import from gemini module
from gemini.chatUtils import determine_response_type
from gemini.baseGeminiQueries import gemini_basic_response

# Import from .products
from .products import search_products

router = APIRouter(prefix="/gemini", tags=["Gemini"])


async def get_conversation_context(
    request: GeminiRequest, session: AsyncSession
) -> str:
    # Get user data
    user = await session.get(Cliente, request.user_id)
    if not user:
        return "User not found."
    user_info = f"Name: {user.nombre}, Last name: {user.apellido}, Username: {user.username}, Age: {user.edad}, Birth date: {user.fecha_nacimiento}, Balance: {user.saldo}, Credit Score: {user.credit_score}, City: {user.ciudad}"

    # Get user transactions
    statement = select(Transaccion).where(Transaccion.cliente_id == request.user_id)
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

    # Build context
    context = (
        f"Here is the user's data: {user_info}\n"
        f"These are their transactions: {transacciones_str}\n"
        f"This is the previous conversation: {request.conversation_context}\n"
        f"And this was their last message to you: {request.last_message}"
    )
    return context


@router.post("/chat")
async def gemini_chat_endpoint(
    request: GeminiRequest, session: AsyncSession = Depends(get_session)
):
    """
    Endpoint that receives the last message, conversation context and user_id.
    Returns a textual context with user data, transactions, context and last message.
    """
    return await get_conversation_context(request, session)


async def process_message(message: GeminiRequest) -> dict:
    """
    Processes a user message by determining its type and responding appropriately.
    If type is 'text', returns a Gemini response.
    If type is 'credit', searches for related products and returns the first 3.
    """
    # Determine message type
    response_type_data = determine_response_type(message)

    if response_type_data["response_type"] == "credit":
        # Search for related products
        product_query = response_type_data["object_in_response"]
        products = search_products(product_query)

        return {
            "response_type": "credit",
            "object_in_response": product_query,
            "products": products[:3],  # Return only the first 3
        }
    else:  # response_type == "text" or any other
        # Normal text response using Gemini
        context = """
        CONTEXT:
        You are an expert environmental and sustainable finance assistant. Your role is to provide accurate, helpful information about:
        - Environmental sustainability and eco-friendly practices
        - Green products and technologies (solar panels, electric vehicles, energy-efficient appliances, water-saving devices, etc.)
        - Sustainable finance and green credits
        - Carbon footprint reduction strategies
        - Renewable energy and conservation methods
        - Climate change mitigation and environmental impact
        
        GUIDELINES:
        - Provide clear, concise, and actionable information
        - Be professional, respectful, and encouraging
        - Focus on practical solutions and benefits
        - If a question is not related to environmental or sustainability topics, politely redirect the conversation back to these areas
        - Use accessible language that users can understand
        
        ------
        USER MESSAGE:
        """
        gemini_response = gemini_basic_response(context + message)
        return {"response_type": "text", "text_response": gemini_response}


@router.post("/process")
async def process_message_endpoint(request: GeminiRequest):
    """
    Endpoint that receives a user message and:
    - Determines if it's a general inquiry (text) or about credits for green products (credit)
    - If 'text': returns a Gemini response
    - If 'credit': searches for related products and returns the first 3
    """
    return await process_message(request.message)
