from .baseGeminiQueries import gemini_structured_response
from models.gemini import ChatResponseType, CreditOffer, CreditOffers
from typing import Optional
import math


def calculate_monthly_payment(
    prestamo: float, interes_anual: float, meses: int
) -> float:
    """
    Calculate monthly payment using the amortization formula.

    Args:
        prestamo: Loan amount in MXN
        interes_anual: Annual interest rate as percentage (e.g., 6.0 for 6%)
        meses: Number of months

    Returns:
        Monthly payment amount
    """
    if meses == 0:
        return 0.0

    # Convert annual interest to monthly rate
    r = (interes_anual / 100) / 12

    # Handle 0% interest case
    if r == 0:
        return prestamo / meses

    # Amortization formula: M = P × [r(1+r)^n] / [(1+r)^n - 1]
    monthly_payment = prestamo * (r * (1 + r) ** meses) / ((1 + r) ** meses - 1)
    return monthly_payment


def calculate_months_from_payment(
    prestamo: float, interes_anual: float, monthly_payment: float
) -> Optional[int]:
    """
    Calculate the number of months needed to pay off a loan given a fixed monthly payment.

    Uses the inverse amortization formula:
    n = -log(1 - (P × r) / M) / log(1 + r)

    Where:
    - P = prestamo (loan amount)
    - r = monthly interest rate
    - M = monthly payment
    - n = number of months

    Args:
        prestamo: Loan amount in MXN
        interes_anual: Annual interest rate as percentage
        monthly_payment: Fixed monthly payment amount

    Returns:
        Number of months needed, or None if impossible (payment too low)
    """
    if monthly_payment <= 0:
        return None

    # Convert annual interest to monthly rate
    r = (interes_anual / 100) / 12

    # Handle 0% interest case
    if r == 0:
        months = prestamo / monthly_payment
        return int(math.ceil(months))

    # Check if payment is sufficient to cover at least the interest
    min_payment = prestamo * r
    if monthly_payment <= min_payment:
        # Payment is too low, loan will never be paid off
        return None

    # Calculate months using inverse amortization formula
    # n = -log(1 - (P × r) / M) / log(1 + r)
    numerator = 1 - (prestamo * r) / monthly_payment

    if numerator <= 0:
        return None

    months = -math.log(numerator) / math.log(1 + r)

    # Round up to nearest whole month
    return int(math.ceil(months))


def find_optimal_months(
    prestamo: float,
    interes_anual: float,
    max_monthly_payment: float,
    max_months: int = 120,
) -> Optional[int]:
    """
    Find the optimal number of months that results in a monthly payment
    close to or below the maximum affordable payment.

    Args:
        prestamo: Loan amount in MXN
        interes_anual: Annual interest rate as percentage
        max_monthly_payment: Maximum monthly payment the user can afford
        max_months: Maximum allowed loan term (default 120 months)

    Returns:
        Optimal number of months, or None if not achievable within max_months
    """
    # Start with minimum reasonable term
    min_months = 6

    # Check if even max_months would work
    payment_at_max = calculate_monthly_payment(prestamo, interes_anual, max_months)
    if payment_at_max > max_monthly_payment:
        return None  # Not achievable even at maximum term

    # Binary search for optimal months
    for months in range(min_months, max_months + 1):
        monthly_payment = calculate_monthly_payment(prestamo, interes_anual, months)
        if monthly_payment <= max_monthly_payment:
            return months

    return None


def validate_and_correct_credit_offer(offer: CreditOffer) -> Optional[CreditOffer]:
    """
    Validate credit offer calculations and correct the loan term (months) if needed.

    IMPORTANT:
    - gasto_inicial_mes is the FIXED MONTHLY PAYMENT for the loan (set by AI, DO NOT CHANGE)
    - prestamo is the loan amount (DO NOT CHANGE)
    - interes is the interest rate (DO NOT CHANGE)
    - gasto_final_mes is the reduced utility cost after product (DO NOT CHANGE)
    - meses_originales is the ONLY value we can adjust

    We calculate the correct number of months based on the fixed payment amount.

    Args:
        offer: Original credit offer from AI

    Returns:
        Corrected credit offer with mathematically correct months, or None if impossible
    """
    prestamo = offer.prestamo
    interes = offer.interes
    fixed_monthly_payment = offer.gasto_inicial_mes  # This is the LOAN payment (fixed)
    gasto_final_mes = offer.gasto_final_mes

    # Calculate the mathematically correct number of months for this fixed payment
    correct_months = calculate_months_from_payment(
        prestamo=prestamo, interes_anual=interes, monthly_payment=fixed_monthly_payment
    )

    # If calculation failed (payment too low), reject the offer
    if correct_months is None:
        print(
            f"Warning: Payment {fixed_monthly_payment} is too low for loan {prestamo} at {interes}% interest"
        )
        return None

    # If months exceed 120, reject the offer
    if correct_months > 120:
        print(f"Warning: Loan requires {correct_months} months (max is 120)")
        return None

    # Create corrected offer with the mathematically correct months
    corrected_offer = CreditOffer(
        prestamo=prestamo,
        interes=interes,
        meses_originales=correct_months,
        descripcion=offer.descripcion,
        gasto_inicial_mes=fixed_monthly_payment,  # Keep fixed payment unchanged
        gasto_final_mes=gasto_final_mes,
        product=offer.product,
    )

    return corrected_offer


def validate_and_correct_credit_offers(credit_offers: CreditOffers) -> CreditOffers:
    """
    Validate and correct all credit offers in the response.
    Filters out offers that require more than 120 months.

    Args:
        credit_offers: CreditOffers object from AI

    Returns:
        CreditOffers with validated and corrected offers
    """
    # Cast to CreditOffers if it's a dict
    if isinstance(credit_offers, dict):
        try:
            credit_offers = CreditOffers(**credit_offers)
        except Exception as e:
            print(f"Warning: Could not cast dict to CreditOffers: {e}")
            return CreditOffers(creditOffers=[])

    corrected_offers = []

    for offer in credit_offers.creditOffers:
        corrected_offer = validate_and_correct_credit_offer(offer)
        if corrected_offer is not None:
            corrected_offers.append(corrected_offer)

    return CreditOffers(creditOffers=corrected_offers)


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
       - MAKE SURE ITS IN SPANISH. ALL TEXT.
    
    5. PROJECTED SAVINGS:
       - Calculate accurate savings based on product specifications:
         * Solar panels: 40-70% reduction in electricity bills
         * LED bulbs: 75-80% reduction in lighting costs
         * High-efficiency appliances: 20-50% reduction in related utility costs
         * Electric vehicles: 60-80% reduction in fuel costs
    
    6. MONTHLY LOAN PAYMENT (gasto_inicial_mes):
       - *** THIS IS THE FIXED MONTHLY PAYMENT THE USER WILL PAY FOR THE LOAN ***
       - This value should be based on the user's monthly expense for the specific category
       - Calculate from user's transaction history over the last 12 months
       - This becomes the FIXED MONTHLY PAYMENT for the credit
       - Examples:
         * For solar panels: If user pays 2,000 MXN/month for electricity, set gasto_inicial_mes = 2,000
         * For electric vehicle: If user pays 5,000 MXN/month for gas, set gasto_inicial_mes = 5,000
         * For energy-efficient appliances: Use average monthly utility expense
       - This value will NOT change - it's the exact monthly payment
       - Use actual transaction data from the conversation context
       - Express in MXN pesos
    
    7. FINAL MONTHLY EXPENSE (gasto_final_mes):
       - This is the EXPECTED monthly expense AFTER implementing the purchased product
       - This represents the REDUCED utility/operational cost (the savings benefit)
       - DO NOT include the credit payment in this calculation
       - Only calculate the reduced utility/operational cost
       - Examples:
         * For solar panels: new expected electricity bill (30-60% of original bill)
         * For electric vehicle: new expected charging costs (20-40% of previous fuel costs)
         * For energy-efficient appliance: new expected utility cost (50-80% of previous cost)
         * For LED bulbs: new expected lighting costs (20-25% of previous costs)
       - This shows the pure savings benefit, independent of the loan
       - Express in MXN pesos
       
    8. LOAN TERM CALCULATION (meses_originales):
       - Calculate using the INVERSE amortization formula:
         * Given: prestamo (P), interes (r), gasto_inicial_mes (M = fixed monthly payment)
         * Calculate: n = -log(1 - (P × r/12) / M) / log(1 + r/12)
       - The months will be automatically validated and corrected if needed
       - Aim for terms between 6-120 months
       - If calculated months exceed 120, the offer may be rejected
    
    9. PRODUCT DATA (product):
       - Each credit offer MUST include specific product information
       - nombre: Specific product name/model (e.g., "Panel Solar 450W Monocristalino", "Tesla Model 3", "Refrigerador Samsung Inverter 18 pies")
       - link: A realistic product URL (can use placeholder like "https://mercadolibre.com.mx/producto/[id]" or similar Mexican retailer)
       - img_link: A realistic image URL (can use placeholder like "https://http2.mlstatic.com/D_NQ_NP_[product-id].jpg")
       - precio: The actual product price in MXN pesos (should match or be close to the prestamo amount)
       - Ensure the product details match the description and loan amount
    
    ANALYSIS REQUIREMENTS:
    - Review the user's transaction history to identify current spending patterns
    - Match credit offers to products that address their highest utility expenses
    - The loan payment should fit within what the user currently pays for the related utility (gasto_inicial_mes)
    - Show realistic ROI and payback periods
    - Generate {num_offers} offers with varying terms and amounts
        
    ---------
    CONVERSATION CONTEXT:
    {conversation_context}
    
    ---------
    INSTRUCTIONS:
    Respond with a JSON array of {num_offers} realistic credit offer objects. Each offer MUST include all fields including the product data (nombre, link, img_link, precio). The product should be specific and tailored to the user's actual situation and needs.
    
    IMPORTANT: MAKE SURE THE CALCULUS FOR THE CREDIT AND SAVINGS IS MATHEMATICALLY CORRECT: 
    THESE FORMULAS MUST HOLD TRUE:
    
    1. MONTHLY PAYMENT CALCULATION:
       - Use the amortization formula for fixed-rate loans:
       - Monthly Payment (M) = P x [r(1+r)^n] / [(1+r)^n - 1]
       Where:
         * P = prestamo (loan amount in MXN)
         * r = monthly interest rate = (interes / 100) / 12
         * n = meses_originales (total number of months)
       
       Example: If prestamo = 120,000 MXN, interes = 6% annual, meses_originales = 36
         * r = (6 / 100) / 12 = 0.005
         * n = 36
         * M = 120,000 x [0.005(1.005)^36] / [(1.005)^36 - 1]
         * M ≈ 3,651.93 MXN per month
    
    2. TOTAL AMOUNT PAID VERIFICATION:
       - Total Paid = Monthly Payment x meses_originales
       - Total Interest = Total Paid - prestamo
       - Verify that total interest aligns with the stated annual interest rate
    
    3. SAVINGS CALCULATION VERIFICATION:
       - gasto_inicial_mes = FIXED MONTHLY LOAN PAYMENT (not related to savings)
       - gasto_final_mes = New reduced utility cost after product installation
       - The savings on utilities should be realistic based on product efficiency:
         * Solar panels: 40-70% reduction in electricity bills
         * Electric vehicles: 60-80% reduction in fuel costs
         * Efficient appliances: 20-50% reduction in utility costs
    
    4. TOTAL PAYMENT VERIFICATION:
       - Total Amount Paid = gasto_inicial_mes x meses_originales
       - This should equal approximately: prestamo + (prestamo x interes_total)
       - Where interes_total is the total interest paid over the life of the loan
       - CRITICAL: Verify this matches the amortization formula results
    
    5. CONSISTENCY CHECKS:
       - Ensure producto.precio ≈ prestamo (loan should cover product cost)
       - Ensure gasto_final_mes < current utility expense (there must be savings)
       - Ensure meses_originales is between 6 and 120 months
       - Ensure interest rate is within 3.5% - 8.5% for green loans
       - VERIFY: gasto_inicial_mes X meses_originales ≈ prestamo + total_interest
    
    EXAMPLE CALCULATION:
    For a solar panel system where the user currently pays 2,500 MXN/month for electricity:
    
    Correct Example:
    - prestamo = 60,000 MXN
    - interes = 6% annual (0.5% monthly)
    - gasto_inicial_mes = 1,800 MXN (FIXED MONTHLY PAYMENT for the loan)
    - gasto_final_mes = 1,000 MXN (new electricity bill after solar panels - 60% reduction)
    
    Calculate months using inverse amortization:
    - r = 6% / 12 = 0.005 (monthly rate)
    - n = -log(1 - (60,000 X 0.005) / 1,800) / log(1.005)
    - n ≈ 36 months
    
    Verification:
    - Monthly Payment using standard formula: M = 60,000 X [0.005(1.005)^36] / [(1.005)^36 - 1] ≈ 1,825 MXN ✓
    - Total Paid = 1,825 X 36 = 65,700 MXN
    - Total Interest = 65,700 - 60,000 = 5,700 MXN
    - Effective rate ≈ 6.02% annual ✓
    - User saves 2,500 - 1,000 = 1,500 MXN/month on electricity AFTER loan is paid
    
    VERIFY ALL CALCULATIONS BEFORE RETURNING THE RESPONSE.
    
    """

    # Get AI-generated offers
    ai_offers = gemini_structured_response(prompt, CreditOffers)

    # Validate and correct the offers
    corrected_offers = validate_and_correct_credit_offers(ai_offers)

    return corrected_offers


if __name__ == "__main__":
    test_message = input("Insert message to determine response type: ")
    response = determine_response_type(test_message)
    print(response)
