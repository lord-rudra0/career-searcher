from PyPDF2 import PdfReader

def extract_careers_from_pdf(pdf_path):
    try:
        # Create a PDF reader object
        reader = PdfReader("backend/careers.pdf")
        
        # Extract text from all pages
        text = ""
        for page in reader.pages:
            text += page.extract_text()
            
        print("=== Extracted Career Information ===")
        print(text)
        print("==================================")
        
        return text
        
    except Exception as e:
        print(f"Error reading PDF: {str(e)}")
        return None