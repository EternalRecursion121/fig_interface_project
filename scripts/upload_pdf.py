import google.generativeai as genai
from pathlib import Path
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv('/Users/atlasfellowship/Documents/PROGRAMMING/interface_project/.env')
print(os.getenv('GEMINI_API_KEY'))
# Configure the API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

def upload_pdf():
    # Load and upload the PDF
    pdf_path = Path('scripts/blog_post.pdf')
    file = genai.upload_file(pdf_path, mime_type='application/pdf')
    
    print(f"PDF_URI={file.uri}")
    
    # Optionally write to .env file
    with open('.env', 'a') as f:
        f.write(f"\nPDF_URI={file.uri}\n")

if __name__ == "__main__":
    upload_pdf() 