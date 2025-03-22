from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import json
import os
import dotenv
import re
from googlesearch import search
import requests
from bs4 import BeautifulSoup
from PyPDF2 import PdfReader  # You'll need to install this package first

dotenv.load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure Google API key
api_key = os.getenv("GEMINI_API_KEY")
print(f"Using API key: {api_key[:5]}...")  # Print first 5 chars for verification
genai.configure(api_key=api_key)

# Initialize Gemini model for each AI function
question_ai = genai.GenerativeModel("gemini-2.0-flash")
summary_ai = genai.GenerativeModel("gemini-2.0-flash")
career_ai = genai.GenerativeModel("gemini-2.0-flash")

def extract_json_from_text(text):
    """Extract JSON from text that might contain markdown or other content"""
    # Try to find JSON pattern
    json_match = re.search(r'\{[\s\S]*\}', text)
    if json_match:
        try:
            return json.loads(json_match.group())
        except:
            return None
    return None

@app.route('/generate-question', methods=['POST'])
def generate_question():
    try:
        data = request.json
        previous_qa = data.get('previousQA', [])
        
        # Log received data
        print("\n=== Generating New Question ===")
        print(f"Received {len(previous_qa)} previous Q&As:")
        for i, qa in enumerate(previous_qa):
            print(f"\nQ{i+1}: {qa['question']}")
            print(f"A{i+1}: {qa['answer']}")
        
        # Format Q&A history
        qa_history = "\n".join([
            f"Question {i+1}: {qa['question']}\nAnswer: {qa['answer']}"
            for i, qa in enumerate(previous_qa)
        ])
        
        print("\nGenerating new question...")
        
        prompt = f"""Based on these previous responses:

{qa_history}

Generate ONE new career-focused multiple-choice question.

IMPORTANT: Your response must be ONLY a JSON object in this exact format:
{{
    "question": "Your question text here",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
}}

Requirements:
1. Question must be unique and different from previous ones
2. Build upon previous answers to explore deeper insights
3. Focus on career-relevant traits, skills, or preferences
4. Options must be distinct and career-relevant
5. Do not include any additional text or explanations
6. Give the question for the person to answer so if user answer then next ai can use that answer to generate the next question
7. generate that type of question so we can easily identify the person's career path    
8. Return ONLY the JSON object"""

        # Generate the response
        response = question_ai.generate_content(prompt)
        response_text = response.text.strip()
        
        # Try to parse the response
        try:
            # First try direct JSON parsing
            question_data = json.loads(response_text)
        except json.JSONDecodeError:
            # If direct parsing fails, try to extract JSON from the text
            question_data = extract_json_from_text(response_text)
            if not question_data:
                raise ValueError("Failed to generate valid question format")

        # Validate the response structure
        if not isinstance(question_data, dict) or \
           'question' not in question_data or \
           'options' not in question_data or \
           not isinstance(question_data['options'], list) or \
           len(question_data['options']) != 4:
            raise ValueError("Invalid question format")

        # Log the generated question
        print("\nGenerated Question:")
        print(f"Question: {question_data['question']}")
        print(f"Options: {question_data['options']}")
        print("=== Generation Complete ===\n")

        return jsonify({"question": question_data})

    except Exception as e:
        print(f"\nError generating question: {str(e)}")
        error_message = str(e) if str(e) else "Failed to generate question"
        return jsonify({"error": error_message}), 500

@app.route('/analyze-answers', methods=['POST'])
def analyze_answers():
    try:
        data = request.json
        all_answers = data.get('answers', [])

        # Step 1: Generate detailed analysis with the first AI
        analysis_prompt = f"""Analyze these career-related responses:
        {json.dumps(all_answers, indent=2)}
        
        Provide a detailed analysis of the person's:
        1. Key strengths
        2. Work preferences
        3. Personality traits
        4. Skill inclinations
        5. Career goals
        6. Education and training
        7. Work experience
        8. Hobbies and interests
        9. Values and priorities
        10. Personal development
        11. Career aspirations
        12. Life goals
        13. Work-life balance
        14. Stress tolerance
        15. Adaptability
        16. Leadership potential
        17. Teamwork skills
        18. Communication skills
        19. Conflict resolution
        20. Problem-solving
        21. Decision-making
        22. Creativity
        23. Innovation
        24. Time management
        25. Work-related stress
        26. Work-related anxiety
        27. Work-related depression
        28. Work-related burnout
        29. Work-related motivation
        30. Work-related satisfaction
        
        
        """

        analysis_response = summary_ai.generate_content(analysis_prompt)
        detailed_analysis = analysis_response.text

        # Step 2: Generate career recommendations with the second AI
        career_prompt = f"""Based on this analysis:
        {detailed_analysis}
        
        Recommend 5 best-matching careers. Format as JSON array:
        [
            {{
                "title": "Career Title",
                "match": match_percentage,
                "description": "Why this career matches",
                "roadmap": [
                    "Entry Level: Required skills and certifications",
                    "Mid Level: Advanced skills and experience",
                    "Senior Level: Expert knowledge and leadership"
                ],
                "colleges": [
                    {{
                        "name": "College/University Name",
                        "program": "Relevant Program",
                        "duration": "Program Duration",
                        "location": "Location"
                    }}
                ]
            }}
        ]
        Include 3-4 top colleges/universities for each career.
        Each match_percentage should be between 75-100.
        """

        career_response = career_ai.generate_content(career_prompt)
        
        # Clean and parse the career response
        cleaned_text = career_response.text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
        
        careers = json.loads(cleaned_text)

        # Step 3: Get PDF-based career recommendations (new code)
        pdf_careers = get_pdf_career_recommendations(detailed_analysis)
        
        return jsonify({
            "ai_generated_careers": careers,
            "pdf_based_careers": pdf_careers
        })

    except Exception as e:
        print(f"Error in analysis: {str(e)}")
        return jsonify({"error": str(e)}), 500

def get_pdf_career_recommendations(detailed_analysis):
    """Extract careers from PDF and match based on analysis"""
    try:
        # Read the PDF
        reader = PdfReader("Career-List.pdf")
        pdf_text = ""
        for page in reader.pages:
            pdf_text += page.extract_text()

        # Use AI to analyze and match careers from PDF
        pdf_analysis_prompt = f"""
        Given this detailed analysis of a person:
        {detailed_analysis}
        
        And this list of careers:
        {pdf_text}
        
        Recommend 5 best-matching careers from the PDF list. Format as JSON array:
        [
            {{
                "title": "Career Title from PDF",
                "match": match_percentage (between 75-100),
                "description": "Why this career from the PDF matches the person's profile"
            }}
        ]
        """

        pdf_career_response = career_ai.generate_content(pdf_analysis_prompt)
        cleaned_pdf_response = pdf_career_response.text.strip()
        
        # Clean the response
        if cleaned_pdf_response.startswith("```json"):
            cleaned_pdf_response = cleaned_pdf_response[7:]
        if cleaned_pdf_response.endswith("```"):
            cleaned_pdf_response = cleaned_pdf_response[:-3]
        
        return json.loads(cleaned_pdf_response)

    except Exception as e:
        print(f"Error in PDF career analysis: {str(e)}")
        return []

@app.route('/test-api', methods=['GET'])
def test_api():
    try:
        response = question_ai.generate_content("Hello, are you working?")
        return jsonify({"status": "ok", "response": response.text})
    except Exception as e:
        print(f"API test error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/list-models', methods=['GET'])
def list_models():
    try:
        models = genai.list_models()
        available_models = [model.name for model in models]
        return jsonify({"available_models": available_models})
    except Exception as e:
        print(f"Error listing models: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/web-search', methods=['POST'])
def web_search():
    try:
        data = request.json
        careers = data.get('careers', [])

        # Create search query based on career matches
        search_terms = []
        for career in careers[:2]:  # Use top 2 career matches
            search_terms.extend([
                career['title'],
                career.get('description', '').split('.')[0]  # First sentence only
            ])

        # Combine search terms
        search_query = f"alternative careers similar to {' '.join(search_terms)} career path requirements skills"

        # Perform web search
        search_results = []
        for result in search(search_query, num_results=5):
            try:
                # Fetch webpage content
                response = requests.get(result, timeout=5)
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract relevant information
                title = soup.title.string if soup.title else "Career Option"
                description = soup.find('meta', {'name': 'description'})
                description = description['content'] if description else "No description available"

                # Calculate relevance score based on keyword matching
                relevance = calculate_relevance(
                    title + " " + description,
                    [career['title'] for career in careers]
                )

                if relevance > 70:  # Only include relevant results
                    search_results.append({
                        'title': clean_title(title),
                        'description': clean_description(description),
                        'link': result,
                        'relevance': relevance
                    })
            except Exception as e:
                print(f"Error processing search result: {str(e)}")
                continue

        return jsonify({
            'results': sorted(search_results, key=lambda x: x['relevance'], reverse=True)
        })

    except Exception as e:
        print(f"Web search error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/search-web-careers', methods=['POST'])
def search_web_careers():
    try:
        data = request.json
        analysis = data.get('analysis', '')

        # Extract key terms from analysis
        key_terms = extract_key_terms(analysis)
        
        # Create search query
        search_query = f"career paths for people with skills in {key_terms} job requirements and description"

        careers_found = []
        
        # Perform web search
        for url in search(search_query, num_results=8):
            try:
                # Fetch webpage content
                response = requests.get(url, timeout=5)
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract career information
                career_info = extract_career_info(soup, analysis)
                
                if career_info and career_info['matchScore'] > 60:
                    careers_found.append(career_info)
                    
            except Exception as e:
                print(f"Error processing result: {str(e)}")
                continue

        # Sort by match score and return top results
        careers_found.sort(key=lambda x: x['matchScore'], reverse=True)
        return jsonify({'careers': careers_found[:5]})

    except Exception as e:
        print(f"Web career search error: {str(e)}")
        return jsonify({'error': str(e)}), 500

def calculate_relevance(text, career_titles):
    """Calculate relevance score based on keyword matching"""
    text = text.lower()
    score = 0
    
    # Keywords to look for
    keywords = set()
    for title in career_titles:
        keywords.update(title.lower().split())
        
    # Calculate score based on keyword presence
    for keyword in keywords:
        if keyword in text:
            score += 20
            
    return min(98, max(70, score))  # Keep score between 70-98

def clean_title(title):
    """Clean and format the title"""
    if not title:
        return "Career Option"
    return title[:100].strip()

def clean_description(description):
    """Clean and format the description"""
    if not description:
        return "No description available"
    return description[:200].strip() + "..."

def extract_key_terms(analysis):
    """Extract key terms from analysis text"""
    # Remove common words and keep important terms
    common_words = {'and', 'or', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with'}
    words = analysis.lower().split()
    key_terms = [word for word in words if word not in common_words]
    return ' '.join(key_terms[:10])  # Use top 10 terms

def extract_career_info(soup, analysis):
    """Extract career information from webpage"""
    try:
        # Get title
        title = soup.find('h1')
        if not title:
            title = soup.find('title')
        title = title.text.strip() if title else "Career Option"
        
        # Get description
        description = soup.find('meta', {'name': 'description'})
        if description:
            description = description['content']
        else:
            # Try to find first paragraph
            description = soup.find('p')
            description = description.text if description else "No description available"
        
        # Extract skills (look for lists or sections containing "skills")
        skills = []
        skill_sections = soup.find_all(['ul', 'ol'], string=re.compile('skill', re.I))
        for section in skill_sections[:1]:  # Take first skills section
            skills.extend([li.text.strip() for li in section.find_all('li')][:5])
        
        # Calculate match score
        match_score = calculate_match_score(title + " " + description, analysis)
        
        return {
            'title': clean_text(title, 100),
            'description': clean_text(description, 200),
            'keySkills': skills if skills else None,
            'matchScore': match_score,
            'sourceLink': soup.url
        }
    except Exception as e:
        print(f"Error extracting career info: {str(e)}")
        return None

def calculate_match_score(text, analysis):
    """Calculate match score between text and analysis"""
    text = text.lower()
    analysis = analysis.lower()
    
    # Extract key terms from analysis
    analysis_terms = set(analysis.split())
    
    # Count matching terms
    matches = sum(1 for term in analysis_terms if term in text)
    
    # Calculate score (base 60, up to 95)
    score = 60 + (matches * 35 / len(analysis_terms))
    return min(95, max(60, round(score)))

def clean_text(text, max_length):
    """Clean and truncate text"""
    text = re.sub(r'\s+', ' ', text).strip()
    if len(text) > max_length:
        text = text[:max_length] + "..."
    return text

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        message = data.get('message')
        chat_history = data.get('chatHistory', [])

        # Format chat history for context
        context = "\n".join([f"{msg['role']}: {msg['content']}" for msg in chat_history])
        
        # Create prompt for Gemini
        prompt = f"""You are a helpful career guidance assistant. Continue this conversation:
        {context}
        user: {message}
        assistant:"""
        
        # Generate response
        response = question_ai.generate_content(prompt)
        
        return jsonify({
            "status": "success",
            "response": response.text
        })
        
    except Exception as e:
        print(f"Chat error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    try:
        print("Starting Flask server on port 5002...")
        app.run(debug=True, port=5002, host='0.0.0.0')
    except Exception as e:
        print(f"Error starting Flask server: {str(e)}")