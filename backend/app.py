from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import json
import os
import dotenv

dotenv.load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Google API key
api_key = os.getenv("GEMINI_API_KEY")
print(f"Using API key: {api_key[:5]}...")  # Print first 5 chars for verification
genai.configure(api_key=api_key)

# Initialize Gemini model for each AI function
question_ai = genai.GenerativeModel("gemini-2.0-flash")
summary_ai = genai.GenerativeModel("gemini-2.0-flash")
career_ai = genai.GenerativeModel("gemini-2.0-flash")

@app.route('/generate-question', methods=['POST'])
def generate_question():
    try:
        data = request.json
        previous_qa = data.get('previousQA', [])
        
        # Format previous Q&A for the AI
        qa_context = "\n".join([f"Q: {qa['question']}\nA: {qa['answer']}" for qa in previous_qa])
        
        prompt = f"""Based on these previous responses:
        {qa_context}
        
        Generate a new career-focused multiple-choice question.
        Format as JSON:
        {{
            "question": "question text",
            "options": ["option1", "option2", "option3", "option4"]
        }}"""

        response = question_ai.generate_content(prompt)
        
        try:
            # Clean and parse the response
            cleaned_text = response.text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            new_question = json.loads(cleaned_text)
            return jsonify({"question": new_question})
        except json.JSONDecodeError:
            return jsonify({"error": "Failed to generate valid question"}), 500

    except Exception as e:
        print(f"Error generating question: {str(e)}")
        return jsonify({"error": str(e)}), 500

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

if __name__ == '__main__':
    app.run(debug=True)