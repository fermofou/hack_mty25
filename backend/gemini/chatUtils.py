from pydantic import BaseModel
from baseGeminiQueries import gemini_structured_response
from typing import Literal


class ChatResponseType(BaseModel):
    """Structured output model for analysis results"""

    response_type: Literal["text", "credit"]


def determine_response_type(message: str) -> ChatResponseType:
    prompt = f"""
      Determine the type of the following message. In here, the user is asking for either general information (text) or information about a possible credit for buying a particular green product that helps reduce its environmental impact in either energy, water or transportation mainly (credit).
      
      If the user is talking about a particular product, like solar panels, electric vehicles, energy-efficient appliances, water-saving devices, or similar items that contribute to environmental sustainability, classify it as 'credit', as they will be provided with credit options for the object in addition to the response for the inquiry.
      
      Possible types are: 'text', 'credit'.
      
      Examples:
      - "What are some tips for reducing my carbon footprint?" -> response_type: "text"
      - "Can I get a credit for installing solar panels on my house?" -> response_type: "credit"
      - "Is there any financial support for buying an electric vehicle?" -> response_type: "credit"
      - "I'm interested in buying a high-efficiency washing machine" -> response_type: "credit"
      - "Tell me about LED light bulbs for my home" -> response_type: "credit"
      
      Message: "{message}"
      Respond with a JSON object with a single field 'response_type' indicating the type.
    """
    return gemini_structured_response(prompt, ChatResponseType)


if __name__ == "__main__":
    test_message = input("Insert message to determine response type: ")
    response = determine_response_type(test_message)
    print(response)
