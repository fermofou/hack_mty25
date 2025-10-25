from .baseGeminiQueries import gemini_structured_response
from models.products import ChatResponseType


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


if __name__ == "__main__":
    test_message = input("Insert message to determine response type: ")
    response = determine_response_type(test_message)
    print(response)
