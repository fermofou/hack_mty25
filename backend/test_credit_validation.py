"""
Test script to verify credit offer validation and correction logic
"""

from gemini.chatUtils import (
    calculate_monthly_payment,
    validate_and_correct_credit_offer,
    validate_and_correct_credit_offers,
)
from models.gemini import CreditOffer, CreditOffers, ProductData


def test_monthly_payment_calculation():
    """Test the amortization formula"""
    print("=== Testing Monthly Payment Calculation ===")

    # Test case from the documentation
    prestamo = 120000
    interes = 6.0
    meses = 36

    monthly_payment = calculate_monthly_payment(prestamo, interes, meses)
    print(f"Loan: ${prestamo:,.2f} MXN")
    print(f"Interest: {interes}% annual")
    print(f"Term: {meses} months")
    print(f"Monthly Payment: ${monthly_payment:,.2f} MXN")
    print(f"Total Paid: ${monthly_payment * meses:,.2f} MXN")
    print(f"Total Interest: ${(monthly_payment * meses) - prestamo:,.2f} MXN")
    print()


def test_validation_with_excessive_months():
    """Test validation when AI returns > 120 months or unaffordable payment"""
    print("=== Testing Validation with Affordability Check ===")

    # Create a mock offer where the user can afford 2000 MXN/month
    product = ProductData(
        nombre="Panel Solar 5kW",
        link="https://mercadolibre.com.mx/test",
        img_link="https://example.com/img.jpg",
        precio=120000.0,
        categoria="Luz",
    )

    # Scenario: User currently pays 2000 MXN/month for electricity
    # After solar panels, they'll pay 800 MXN/month
    # They can afford to redirect their 2000 MXN to loan payment
    offer = CreditOffer(
        prestamo=120000.0,
        interes=6.0,
        meses_originales=36,  # This would require 3651.93 MXN/month - TOO HIGH!
        descripcion="Sistema de paneles solares",
        gasto_inicial_mes=2000.0,  # Max affordable payment
        gasto_final_mes=800.0,  # New electricity cost after panels
        product=product,
    )

    print(f"Original offer: {offer.meses_originales} months")
    print(f"User's max affordable payment: ${offer.gasto_inicial_mes:,.2f} MXN/month")

    original_payment = calculate_monthly_payment(
        offer.prestamo, offer.interes, offer.meses_originales
    )
    print(f"Original monthly payment would be: ${original_payment:,.2f} MXN/month")
    print(
        f"This exceeds affordable amount by: ${original_payment - offer.gasto_inicial_mes:,.2f} MXN/month"
    )

    corrected = validate_and_correct_credit_offer(offer)

    if corrected:
        print(f"\n✅ Corrected offer: {corrected.meses_originales} months")
        monthly_payment = calculate_monthly_payment(
            corrected.prestamo, corrected.interes, corrected.meses_originales
        )
        print(f"Corrected monthly payment: ${monthly_payment:,.2f} MXN/month")
        print(f"Within budget? {monthly_payment <= corrected.gasto_inicial_mes}")
        print(
            f"Monthly savings from product: ${corrected.gasto_inicial_mes - corrected.gasto_final_mes:,.2f} MXN"
        )
    else:
        print("❌ Offer rejected (cannot be paid affordably within 120 months)")
    print()


def test_validation_with_multiple_offers():
    """Test validation with multiple offers considering affordability"""
    print("=== Testing Multiple Offers Validation ===")

    product1 = ProductData(
        nombre="Panel Solar 5kW",
        link="https://mercadolibre.com.mx/test1",
        img_link="https://example.com/img1.jpg",
        precio=60000.0,
        categoria="Luz",
    )

    product2 = ProductData(
        nombre="Auto Eléctrico",
        link="https://mercadolibre.com.mx/test2",
        img_link="https://example.com/img2.jpg",
        precio=400000.0,
        categoria="Transporte",
    )

    offers = CreditOffers(
        creditOffers=[
            # Offer 1: Affordable solar panels
            CreditOffer(
                prestamo=60000.0,
                interes=6.0,
                meses_originales=24,  # AI suggested 24 months
                descripcion="Sistema de paneles solares",
                gasto_inicial_mes=2000.0,  # User pays 2000/month for electricity
                gasto_final_mes=800.0,  # Will pay 800/month after panels
                product=product1,
            ),
            # Offer 2: Electric car - needs longer term
            CreditOffer(
                prestamo=400000.0,
                interes=7.5,
                meses_originales=60,  # AI suggested 60 months
                descripcion="Auto eléctrico",
                gasto_inicial_mes=5000.0,  # User pays 5000/month for gas
                gasto_final_mes=1500.0,  # Will pay 1500/month for charging
                product=product2,
            ),
        ]
    )

    print(f"Original offers: {len(offers.creditOffers)}")
    for i, offer in enumerate(offers.creditOffers, 1):
        original_payment = calculate_monthly_payment(
            offer.prestamo, offer.interes, offer.meses_originales
        )
        print(
            f"  Offer {i}: {offer.meses_originales} months, "
            f"${original_payment:,.2f}/month (affordable: ${offer.gasto_inicial_mes:,.2f})"
        )

    corrected_offers = validate_and_correct_credit_offers(offers)

    print(f"\nCorrected offers: {len(corrected_offers.creditOffers)}")
    for i, offer in enumerate(corrected_offers.creditOffers, 1):
        monthly = calculate_monthly_payment(
            offer.prestamo, offer.interes, offer.meses_originales
        )
        print(
            f"  Offer {i}: {offer.meses_originales} months, "
            f"${monthly:,.2f} MXN/month (within budget: {monthly <= offer.gasto_inicial_mes})"
        )
        print(
            f"    Monthly savings: ${offer.gasto_inicial_mes - offer.gasto_final_mes:,.2f} MXN"
        )
    print()


if __name__ == "__main__":
    test_monthly_payment_calculation()
    test_validation_with_excessive_months()
    test_validation_with_multiple_offers()

    print("✅ All tests completed!")
