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
    # Create a prompt for Gemini AI
    prompt = f"""
    act as career advisor and generate questions based on the answers
    Based on these answers from a quiz: {answers}
    
    Generate 1 follow-up questions that would help assess the respondent's skills and thinking further.
    and give only 5 questions.
    after 5 questions, stop the generation. and valuate all the answer and act as career counselor and give 5 real world career  with possibility of success with percentage .
    user should get the his career path with the percentage of success.
    after 5 questions, stop the generation. and valuate all the answer and act as career counselor and give 5 real world career  with possibility of success with percentage .
    Each question should have 4 multiple choice options.
    
    Return ONLY valid JSON in exactly this format, with no additional text:
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
                    // Add more questions here
                ]
            }}
        ],
        "careers": [
            {{
                "name": "Career Name",
                "match_percentage": 85
            }},
            // Add more careers here
        ]
    }}
    
    """
    
    try:
        response = model.generate_content(prompt)
        # Parse the response text as JSON
        questions_json = json.loads(response.text)
        return questions_json
    except Exception as e:
        print(f"Error generating questions: {str(e)}")
        # Return a default response if there's an error
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
                {
                    "name": "Software Engineer",
                    "match_percentage": 85
                },
                {
                    "name": "Data Scientist",
                    "match_percentage": 80
                },
                {
                    "name": "Product Manager",
                    "match_percentage": 75
                },
                {
                    "name": "UX Designer",
                    "match_percentage": 70
                },
                {
                    "name": "Marketing Specialist",
                    "match_percentage": 65
                }
            ]
        }

@app.route('/analyze', methods=['POST'])
def analyze_answers():
    try:
        data = request.json
        answers = data.get('answers', [])
        
        # Generate follow-up questions based on answers
        follow_up_questions = generate_follow_up_questions(answers)
        
        return jsonify(follow_up_questions)
    except Exception as e:
        print(f"Error in analyze_answers: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)