from .baseGeminiQueries import gemini_structured_response
from models.gemini import ChatResponseType, CreditOffer, CreditOffers


def determine_response_type(message: str) -> ChatResponseType:
    prompt = f"""
      Determine the type of the following message. In here, the user is asking for either general information (text) or information about a possible credit for buying a particular green product that helps reduce its environmental impact in either energy, water or transportation mainly (credit).
      
      If the user is talking about a particular product, like solar panels, electric vehicles, energy-efficient appliances, water-saving devices, or similar items that contribute to environmental sustainability, classify it as 'credit', as they will be provided with credit options for the object in addition to the response for the inquiry.
      
      Possible types are: 'text', 'credit'.
      
      Additionally, identify the specific object or product mentioned in the message. If multiple objects are mentioned, choose the most relevant or interesting one for the user based on context. If no specific object is mentioned (for general information requests), set object_in_response to an empty string.
      
      Examples:
      - "What are some tips for reducing my carbon footprint?" -> response_type: "text", object_in_response: ""
      - "Can I get a credit for installing solar panels on my house?" -> response_type: "credit", object_in_response: "solar panels"
      - "Is there any financial support for buying an electric vehicle?" -> response_type: "credit", object_in_response: "electric vehicle"
      - "I'm interested in buying a high-efficiency washing machine" -> response_type: "credit", object_in_response: "high-efficiency washing machine"
      - "Tell me about LED light bulbs for my home" -> response_type: "credit", object_in_response: "LED light bulbs"
      - "I want to buy solar panels and a water heater" -> response_type: "credit", object_in_response: "solar panels"
      
      Message: "{message}"
      Respond with a JSON object with two fields: 'response_type' indicating the type, and 'object_in_response' containing the specific object mentioned (or empty string if none).
    """
    return gemini_structured_response(prompt, ChatResponseType)


def create_credit_offers(
    conversation_context: str, num_offers: int = 3
) -> CreditOffers:
    prompt = f"""
    You are a financial advisor specializing in green financing and sustainable products. Based on the conversation context provided, generate realistic credit offers for green products that help reduce environmental impact.
    
    IMPORTANT GUIDELINES FOR REALISTIC OFFERS:
    1. LOAN AMOUNTS (prestamo):
       - Base the loan amount on realistic market prices for the mentioned products in Mexican pesos (MXN)
       - Consider the user's financial capacity based on their transaction history and balance
       - All prices are in MXN pesos
    
    2. INTEREST RATES (interes):
       - Use competitive green loan rates: typically 3.5% to 8.5% annual rate
       - Lower rates for better credit scores and shorter terms
       - Green products often qualify for preferential rates
    
    3. LOAN TERMS (meses_originales):
       - Match term to product lifespan and loan amount
       - Small purchases ($9,000-$54,000 MXN): 12-36 months
       - Medium purchases ($54,000-$270,000 MXN): 24-60 months
       - Large purchases ($270,000+ MXN): 36-120 months
    
    4. DESCRIPTIONS (descripcion):
       - Be specific about the product and its environmental benefits
       - Mention concrete savings and payback period if applicable
       - Include relevant product specifications or capacity
       - ONLY 1 SENTENCE. DO NOT MAKE IT LONG.
    
    5. PROJECTED SAVINGS:
       - Calculate accurate savings based on product specifications:
         * Solar panels: 40-70% reduction in electricity bills
         * LED bulbs: 75-80% reduction in lighting costs
         * High-efficiency appliances: 20-50% reduction in related utility costs
         * Electric vehicles: 60-80% reduction in fuel costs
    
    6. INITIAL MONTHLY EXPENSE (gasto_inicial_mes):
       - This is the AVERAGE monthly expense the user is currently paying for the specific category
       - Calculate from user's transaction history over the last 12 months
       - Examples:
         * For solar panels: average monthly electricity bill
         * For electric vehicle: average monthly gasoline/fuel expenses
         * For energy-efficient appliances: average monthly expense on related utility (electricity for refrigerator, water for washing machine, etc.)
         * For LED bulbs: average monthly lighting/electricity costs
       - Use actual transaction data from the conversation context
       - Express in MXN pesos
    
    7. FINAL MONTHLY EXPENSE (gasto_final_mes):
       - This is the EXPECTED monthly expense AFTER implementing the purchased product
       - DO NOT include the credit payment in this calculation
       - Only calculate the reduced utility/operational cost
       - Examples:
         * For solar panels: new expected electricity bill (30-60% of gasto_inicial_mes)
         * For electric vehicle: new expected charging costs (20-40% of previous fuel costs)
         * For energy-efficient appliance: new expected utility cost (50-80% of previous cost)
         * For LED bulbs: new expected lighting costs (20-25% of previous costs)
       - This shows the pure savings benefit, independent of the loan
       - Express in MXN pesos
    
    8. PRODUCT DATA (product):
       - Each credit offer MUST include specific product information
       - nombre: Specific product name/model (e.g., "Panel Solar 450W Monocristalino", "Tesla Model 3", "Refrigerador Samsung Inverter 18 pies")
       - link: A realistic product URL (can use placeholder like "https://mercadolibre.com.mx/producto/[id]" or similar Mexican retailer)
       - img_link: A realistic image URL (can use placeholder like "https://http2.mlstatic.com/D_NQ_NP_[product-id].jpg")
       - precio: The actual product price in MXN pesos (should match or be close to the prestamo amount)
       - Ensure the product details match the description and loan amount
    
    ANALYSIS REQUIREMENTS:
    - Review the user's transaction history to identify current spending patterns
    - Match credit offers to products that address their highest utility expenses
    - Ensure monthly payments are affordable (typically 20-35% of monthly income)
    - Show realistic ROI and payback periods
    - Generate {num_offers} offers with varying terms and amounts
        
    ---------
    CONVERSATION CONTEXT:
    {conversation_context}
    
    ---------
    INSTRUCTIONS:
    Respond with a JSON array of {num_offers} realistic credit offer objects. Each offer MUST include all fields including the product data (nombre, link, img_link, precio). The product should be specific and tailored to the user's actual situation and needs.
    """

    return gemini_structured_response(prompt, CreditOffers)


if __name__ == "__main__":
    test_message = input("Insert message to determine response type: ")
    response = determine_response_type(test_message)
    print(response)
