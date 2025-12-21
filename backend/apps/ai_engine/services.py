import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client()
def ask_gemini(prompt):
    response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt,
)
    
    return response.text




