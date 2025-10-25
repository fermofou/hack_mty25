from pydantic import BaseModel
from typing import Literal
from .products import ProductResponse


class GeminiRequest(BaseModel):
    last_message: str
    conversation_context: str
    user_id: int


class ChatResponseType(BaseModel):
    """Structured output model for analysis results"""

    response_type: Literal["text", "credit"]
    object_in_response: str


class CreditOffer(BaseModel):
    prestamo: float
    interes: float
    meses_originales: int
    descripcion: str
    gasto_inicial_mes: float
    gasto_final_mes: float


class CreditOffers(BaseModel):
    creditOffers: list[CreditOffer]


class ChatMessageResponse(BaseModel):
    """
    Response model when the message is of type 'credit' ro 'text'.
    Includes the identified object and a list of related products.
    """

    response_type: Literal["text", "credit"]
    object_in_response: str
    creditOffers: list[CreditOffer]
