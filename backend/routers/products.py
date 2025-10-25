from fastapi import APIRouter
import http.client
import ssl
import certifi
import urllib.parse
import json
import re
import os
from typing import List, Optional
from models.products import ProductResponse

router = APIRouter(prefix="/productos", tags=["Productos"])


def parse_price(price_str):
    """
    Convert a price string like 'MX$3,140.50' or 'USD 1,200.75' into a float.
    Returns None if parsing fails.
    """
    if not price_str:
        return None
    # Remove all non-digit, non-dot, non-comma characters
    cleaned = re.sub(r"[^\d.,]", "", price_str)
    # If both comma and dot exist, assume dot is decimal separator
    if "." in cleaned and "," in cleaned:
        cleaned = cleaned.replace(",", "")
    # If only comma exists, assume it's decimal separator
    elif "," in cleaned and "." not in cleaned:
        cleaned = cleaned.replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


def search_products(query, page=1, country="mx"):
    # Use certifi's CA bundle for SSL verification
    context = ssl.create_default_context(cafile=certifi.where())
    conn = http.client.HTTPSConnection(
        "product-search-api.p.rapidapi.com", context=context
    )

    payload = urllib.parse.urlencode({"query": query, "page": page, "country": country})

    rapidapi_key = os.environ.get("RAPIDAPI_KEY")
    if not rapidapi_key:
        raise RuntimeError("RAPIDAPI_KEY not set in environment variables")

    headers = {
        "x-rapidapi-key": rapidapi_key,
        "x-rapidapi-host": "product-search-api.p.rapidapi.com",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    conn.request("POST", "/shopping", payload, headers)
    res = conn.getresponse()
    data = res.read()

    products_data = json.loads(data.decode("utf-8")).get("products", [])

    simplified_products = [
        {
            "nombre": p.get("title", ""),
            "link": p.get("link", ""),
            "img_link": p.get("imageUrl", ""),
            "precio": parse_price(p.get("price", "")),
        }
        for p in products_data[:20]
    ]

    return simplified_products


@router.get("/buscar/", response_model=List[ProductResponse])
async def search_products_endpoint(query: str, page: int = 1, country: str = "mx"):
    """
    Search for products using the external API.

    - **query**: Search term
    - **page**: Page number (default 1)
    - **country**: Search country (default "mx")
    """
    return search_products(query, page, country)
