from PyPDF2 import PdfReader

def test_pdf_reading():
    try:
        reader = PdfReader("Career-List.pdf")
        print(f"Successfully opened PDF with {len(reader.pages)} pages")
        
        # Try to read first page
        text = reader.pages[0].extract_text()
        print("\nFirst 200 characters of content:")
        print(text[:200])
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_pdf_reading() 