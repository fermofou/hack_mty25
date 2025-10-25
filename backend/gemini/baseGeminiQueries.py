"""
Gemini API Integration
"""

import google.generativeai as genai
import os
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

genai.configure(api_key=GEMINI_API_KEY)


# Pydantic models for structured output
class AnalysisResult(BaseModel):
    """Structured output model for analysis results"""

    summary: str
    sentiment: str
    key_points: list[str]
    confidence_score: float


class ProductRecommendation(BaseModel):
    """Structured output model for product recommendations"""

    product_name: str
    category: str
    price_range: str
    reasoning: str
    recommended: bool


def gemini_basic_response(prompt: str, model_name: str = "gemini-2.5-flash") -> str:
    """
    Basic Gemini API function that returns a simple text response.

    Args:
        prompt (str): The user's message/prompt
        model_name (str): The Gemini model to use (default: gemini-2.5-flash)

    Returns:
        str: The AI's response as plain text

    Example:
        >>> response = gemini_basic_response("What is the capital of France?")
        >>> print(response)
        "The capital of France is Paris."
    """
    try:
        # Initialize the model
        model = genai.GenerativeModel(model_name)

        # Generate response
        response = model.generate_content(prompt)

        # Return the text content
        return response.text

    except Exception as e:
        return f"Error generating response: {str(e)}"


def gemini_structured_response(
    prompt: str, response_schema: BaseModel, model_name: str = "gemini-2.5-flash"
) -> dict:
    """
    Gemini API function that returns structured output based on a Pydantic schema.

    Args:
        prompt (str): The user's message/prompt
        response_schema (BaseModel): Pydantic model defining the expected response structure
        model_name (str): The Gemini model to use (default: gemini-2.5-flash)

    Returns:
        dict: Structured response matching the provided schema

    Example:
        >>> prompt = "Analyze this review: 'This product is amazing! Best purchase ever.'"
        >>> result = gemini_structured_output(prompt, AnalysisResult)
        >>> print(result)
        {
            "summary": "Positive product review",
            "sentiment": "positive",
            "key_points": ["Product quality praised", "Customer satisfaction"],
            "confidence_score": 0.95
        }
    """
    try:
        # Initialize the model with structured output configuration
        model = genai.GenerativeModel(
            model_name,
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": response_schema,
            },
        )

        # Generate response
        response = model.generate_content(prompt)

        # Parse and validate the response
        import json

        structured_data = json.loads(response.text)

        # Validate against the schema
        validated_response = response_schema(**structured_data)

        # Return as dictionary
        return validated_response.model_dump()

    except Exception as e:
        return {"error": f"Error generating structured response: {str(e)}"}


# Example usage functions
def example_basic_usage():
    """Example of using the basic response function"""
    print("=== Basic Response Example ===")
    prompt = "Explain what FastAPI is in one sentence."
    response = gemini_basic_response(prompt)
    print(f"Prompt: {prompt}")
    print(f"Response: {response}\n")


def example_structured_usage():
    """Example of using the structured output function"""
    print("=== Structured Output Example ===")

    # Example 1: Analysis
    prompt1 = """
    Analyze this customer review: 
    'I absolutely love this product! It exceeded my expectations. 
    The quality is outstanding and it arrived on time. Highly recommended!'
    """
    result1 = gemini_structured_response(prompt1, AnalysisResult)
    print(f"Analysis Result: {result1}\n")


if __name__ == "__main__":
    # Test the functions
    print("Testing Gemini API Integration...\n")

    try:
        example_basic_usage()
        example_structured_usage()
    except Exception as e:
        print(f"Error during testing: {e}")
        print("\nMake sure to set your GEMINI_API_KEY in a .env file:")
        print("GEMINI_API_KEY=your_api_key_here")
