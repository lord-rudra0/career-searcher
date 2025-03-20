from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import json
import os
import dotenv
import re

dotenv.load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

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
6. Return ONLY the JSON object"""

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
        4. Skill inclinations"""

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
                "description": "Why this career matches"
            }}
        ]
        Each match_percentage should be between 85-98."""

        career_response = career_ai.generate_content(career_prompt)
        
        # Clean and parse the career response
        cleaned_text = career_response.text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
        
        careers = json.loads(cleaned_text)
        return jsonify({"careers": careers})

    except Exception as e:
        print(f"Error in analysis: {str(e)}")
        return jsonify({"error": str(e)}), 500

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

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    app.run(debug=True)