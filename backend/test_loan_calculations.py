"""
Test to verify loan calculations are mathematically correct
"""

from gemini.chatUtils import calculate_monthly_payment, calculate_months_from_payment


def test_loan_calculation_example():
    """
    Test the example from the user:
    - Monto: 273.53 MXN
    - Interés: 7.5%
    - Mensualidad: 177 MXN
    - Should calculate correct months
    """
    print("=== Testing User's Example ===")
    prestamo = 273.53
    interes = 7.5
    mensualidad = 177.0

    print(f"Loan Amount (prestamo): ${prestamo:,.2f} MXN")
    print(f"Annual Interest Rate: {interes}%")
    print(f"Fixed Monthly Payment: ${mensualidad:,.2f} MXN")

    # Calculate correct months
    months = calculate_months_from_payment(prestamo, interes, mensualidad)

    if months:
        print(f"\nCalculated Months: {months}")

        # Verify by calculating what the monthly payment should be
        verify_payment = calculate_monthly_payment(prestamo, interes, months)
        print(f"Verification - Monthly Payment: ${verify_payment:,.2f} MXN")

        # Calculate totals
        total_paid = mensualidad * months
        total_interest = total_paid - prestamo

        print(f"\nTotal Amount Paid: ${total_paid:,.2f} MXN")
        print(f"Total Interest Paid: ${total_interest:,.2f} MXN")
        print(f"Loan Principal: ${prestamo:,.2f} MXN")
        print(f"Interest Percentage of Loan: {(total_interest / prestamo) * 100:.2f}%")

        # Check if total makes sense
        if total_paid > prestamo:
            print(f"\n✓ Total paid ({total_paid:.2f}) > Principal ({prestamo:.2f}) ✓")
        else:
            print(
                f"\n✗ ERROR: Total paid ({total_paid:.2f}) should be > Principal ({prestamo:.2f})"
            )

        # The issue mentioned: 1,062 total when it should be around 273.53 + interest
        # Let's see what 6 months would give us
        print("\n--- If user saw 6 months ---")
        print(f"Total with 6 months: ${mensualidad * 6:,.2f} MXN")
        print(
            f"This is WRONG because it's {((mensualidad * 6) / prestamo - 1) * 100:.1f}% over the loan amount"
        )

    else:
        print("ERROR: Could not calculate months (payment too low)")

    print()


def test_realistic_solar_panel_example():
    """Test with a realistic solar panel loan"""
    print("=== Testing Realistic Solar Panel Loan ===")

    prestamo = 60000.0
    interes = 6.0
    mensualidad = 1800.0

    print(f"Loan Amount: ${prestamo:,.2f} MXN")
    print(f"Annual Interest: {interes}%")
    print(f"Fixed Monthly Payment: ${mensualidad:,.2f} MXN")

    months = calculate_months_from_payment(prestamo, interes, mensualidad)

    if months:
        print(f"\nCalculated Months: {months}")

        # Verify
        verify_payment = calculate_monthly_payment(prestamo, interes, months)
        print(f"Verification - Expected Payment: ${verify_payment:,.2f} MXN")
        print(f"Actual Payment: ${mensualidad:,.2f} MXN")
        print(f"Difference: ${abs(verify_payment - mensualidad):.2f} MXN")

        total_paid = verify_payment * months
        total_interest = total_paid - prestamo

        print(f"\nTotal Paid: ${total_paid:,.2f} MXN")
        print(f"Principal: ${prestamo:,.2f} MXN")
        print(f"Interest: ${total_interest:,.2f} MXN")
        print(
            f"Effective Annual Rate: {(total_interest / prestamo) / (months / 12) * 100:.2f}%"
        )

    print()


def test_edge_cases():
    """Test edge cases"""
    print("=== Testing Edge Cases ===")

    # Payment too low (should fail)
    print("1. Payment too low:")
    result = calculate_months_from_payment(10000, 12.0, 50)  # $50/month for $10k at 12%
    print(f"   Result: {result} (should be None - payment too low)")

    # Zero interest
    print("\n2. Zero interest:")
    months = calculate_months_from_payment(10000, 0, 500)
    print(f"   10,000 / 500 = {months} months (should be 20)")

    # Very high payment (short term)
    print("\n3. Very high payment:")
    months = calculate_months_from_payment(1000, 6.0, 500)
    print(f"   Result: {months} months (should be ~2)")
    if months:
        verify = calculate_monthly_payment(1000, 6.0, months)
        print(f"   Verification: ${verify:.2f} per month")

    print()


if __name__ == "__main__":
    test_loan_calculation_example()
    test_realistic_solar_panel_example()
    test_edge_cases()
    print("✅ All tests completed!")
