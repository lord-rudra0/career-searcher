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
        
        # First AI: Question Generator
        context = """You are an AI career counselor. Based on the following previous questions and answers, 
        generate a new multiple-choice question that will help determine the user's ideal career path. 
        
        Requirements:
        1. Question must be different from previous ones
        2. Build upon previous responses to dig deeper
        3. Focus on career-relevant traits, skills, or preferences
        4. Include 4 distinct and relevant options
        5. Make options specific and mutually exclusive
        
        Format the response EXACTLY as this JSON:
        {
            "question": "Your question text here",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
        }
        
        Previous Q&A History:\n"""
        
        for qa in previous_qa:
            context += f"Q: {qa['question']}\nSelected: {qa['answer']}\n\n"
        
        response = question_ai.generate_content(context)
        question_data = json.loads(response.text)
        
        return jsonify({
            "question": {
                "id": len(previous_qa) + 1,
                "question": question_data["question"],
                "type": "mcq",
                "options": question_data["options"]
            }
        })
    except Exception as e:
        print(f"Error generating question: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/analyze-answers', methods=['POST'])
def analyze_answers():
    try:
        data = request.json
        answers = data.get('answers', [])
        
        # Second AI: Detailed Profile Analysis
        summary_prompt = """As a career analysis AI, create a comprehensive profile summary based on these multiple-choice responses.
        
        Focus on:
        1. Key personality traits
        2. Professional interests
        3. Skills and competencies
        4. Work style preferences
        5. Values and motivations
        6. Learning style and adaptability
        7. Leadership potential
        8. Communication style
        9. Decision-making approach
        10. Career priorities
        
        Responses to analyze:\n"""
        
        for qa in answers:
            summary_prompt += f"Q: {qa['question']}\nSelected: {qa['answer']}\n\n"
        
        # Third AI: Career Matching
        career_prompt = f"""As a career matching specialist, analyze this candidate profile and recommend the top 5 careers.
        
        Candidate Profile:
        {summary_prompt}
        
        Return the response as a JSON array. Do not include any markdown formatting or code block indicators.
        The response should match exactly this structure:
        [
            {{
                "title": "Career Title",
                "match": 85,
                "description": "Key reasons, required skills, growth potential, and work environment fit"
            }}
        ]
        
        Important:
        - Return only the JSON array, no other text
        - Do not include ```json or ``` markers
        - Ensure valid JSON format
        - Include exactly 5 career recommendations"""
        
        # Add error handling for career generation and JSON parsing
        try:
            career_response = career_ai.generate_content(career_prompt)
            if not career_response:
                raise Exception("Failed to generate career matches")
            
            # Remove any markdown code block indicators from the response
            cleaned_text = career_response.text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            cleaned_text = cleaned_text.strip()
            
            try:
                careers = json.loads(cleaned_text)
                if not isinstance(careers, list):
                    raise Exception("Invalid career response format")
            except json.JSONDecodeError as e:
                print(f"Invalid JSON response: {cleaned_text}")
                return jsonify({"error": "Failed to parse career recommendations"}), 500
                
        except Exception as e:
            print(f"Career generation error: {str(e)}")
            return jsonify({"error": "Failed to generate career matches"}), 500

        return jsonify({"careers": careers})
        
    except Exception as e:
        print(f"Error analyzing answers: {str(e)}")
        return jsonify({
            "error": str(e),
            "details": "An error occurred while processing your answers"
        }), 500

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