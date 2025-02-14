from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini AI
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
model = genai.GenerativeModel('gemini-pro')

def generate_follow_up_questions(answers):
    # Create a structured prompt for Gemini AI
    prompt = f"""
    Act as a professional career advisor.

    1️⃣ Based on these quiz answers: {answers}, generate exactly **1 follow-up questions** in 5 pages  that further assess the respondent's skills.  
       **important: After generating  questions, STOP and provide an AI-based career analysis.**
       Each question must have 4 multiple-choice options.

    2️⃣ After generating exactly 5 questions, STOP and provide an AI-based **career analysis**:  
       Suggest 5 real-world career options with a success probability percentage based on the answers.

    🛑 **IMPORTANT:** Return ONLY valid JSON, structured exactly like this:
    {{
        "questions": [
            {{
                "category": "Follow-up Assessment",
                "questions": [
                    {{
                        "id": "follow_1",
                        "text": "Question text here?",
                        "options": [
                            "Option 1",
                            "Option 2",
                            "Option 3",
                            "Option 4"
                        ]
                    }},
                    // EXACTLY 5 questions here
                ]
            }}
        ],
        "careers": [
            {{
                "name": "Career Name",
                "match_percentage": 85
            }},
            // EXACTLY 5 careers here
        ]
    }}
    """

    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()  # Ensure clean output
        questions_json = json.loads(response_text)

        # ✅ Enforce exactly 5 questions (trim excess if necessary)
        if 'questions' in questions_json and len(questions_json["questions"][0]["questions"]) > 5:
            questions_json["questions"][0]["questions"] = questions_json["questions"][0]["questions"][:5]

        # ✅ Ensure exactly 5 career options
        if 'careers' in questions_json and len(questions_json["careers"]) > 5:
            questions_json["careers"] = questions_json["careers"][:5]

        return questions_json
    except Exception as e:
        print(f"Error generating questions: {str(e)}")
        return {
            "questions": [
                {
                    "category": "Follow-up Assessment",
                    "questions": [
                        {
                            "id": "follow_1",
                            "text": "Could you elaborate on your problem-solving approach?",
                            "options": [
                                "Systematic analysis",
                                "Intuitive decision making",
                                "Collaborative problem solving",
                                "Research-based approach"
                            ]
                        }
                    ]
                }
            ],
            "careers": [
                {"name": "Software Engineer", "match_percentage": 85},
                {"name": "Data Scientist", "match_percentage": 80},
                {"name": "Product Manager", "match_percentage": 75},
                {"name": "UX Designer", "match_percentage": 70},
                {"name": "Marketing Specialist", "match_percentage": 65}
            ]
        }

@app.route('/analyze', methods=['POST'])
def analyze_answers():
    try:
        data = request.json
        answers = data.get('answers', [])
        
        # Generate follow-up questions and career analysis
        follow_up_questions = generate_follow_up_questions(answers)
        
        return jsonify(follow_up_questions)
    except Exception as e:
        print(f"Error in analyze_answers: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
