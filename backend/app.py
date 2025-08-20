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
import time
from functools import lru_cache

dotenv.load_dotenv(override=True)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure Google API key
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not api_key:
    # Fail fast with clear message if key is missing
    raise RuntimeError("Missing API key. Set GEMINI_API_KEY or GOOGLE_API_KEY in backend/.env")

# Basic sanity check to prevent hard-to-debug downstream 400s
masked = (api_key[:5] + "…") if len(api_key) >= 5 else "(too short)"
print(f"Using API key (prefix): {masked}")
if not api_key.startswith("AIza"):
    print("Warning: API key does not start with 'AIza'. It may be malformed and cause API_KEY_INVALID errors.")

genai.configure(api_key=api_key)

# Initialize Gemini model for each AI function
question_ai = genai.GenerativeModel("gemini-1.5-flash")
summary_ai = genai.GenerativeModel("gemini-1.5-flash")
career_ai = genai.GenerativeModel("gemini-1.5-flash")

# Cache PDF text to avoid repeated disk I/O and parsing
@lru_cache(maxsize=1)
def get_pdf_text():
    reader = PdfReader("Career-List.pdf")
    text = ""
    max_pages = min(8, len(reader.pages))
    for page in reader.pages[:max_pages]:
        text += (page.extract_text() or "") + "\n"
    return text[:15000]

def extract_json_from_text(text):
    """Extract JSON from text that might contain markdown or other content"""
    # Try to find JSON pattern
    json_match = re.search(r'\{[\s\S]*\}', text)
    if json_match:
        try:
            return json.loads(json_match.group())
        except:
            return None

def generate_json_array_with_retry(model, prompt, schema_hint=None):
    """Generate a JSON array with a retry using a stricter prompt if needed.
    Returns a Python list or raises ValueError.
    """
    # First attempt
    resp = model.generate_content(prompt)
    raw = (resp.text or "").strip()
    parsed = extract_json_array_from_text(raw)
    if parsed is not None:
        return parsed

    # Second attempt with stricter instructions
    strict_prompt = (
        (schema_hint or "") +
        "\nYou must return ONLY a JSON array, with no surrounding text, no markdown fences, no comments.\n"
        "If any information appears missing, infer reasonable values based on the analysis.\n"
        "Output must be valid JSON and parseable as-is."
    )
    resp2 = model.generate_content(strict_prompt)
    raw2 = (resp2.text or "").strip()
    parsed2 = extract_json_array_from_text(raw2)
    if parsed2 is not None:
        return parsed2

    preview = (raw2 or raw)[:200]
    raise ValueError(f"Failed to parse JSON array after retry. Preview: {preview}")
    return None

def extract_json_array_from_text(text):
    """Extract a JSON array from text, tolerant of code fences and extra prose."""
    # Remove common code fences
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]

    # Direct attempt
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, list):
            return parsed
    except Exception:
        pass

    # Regex fallback to first top-level array
    arr_match = re.search(r'\[[\s\S]*\]', cleaned)
    if arr_match:
        try:
            return json.loads(arr_match.group())
        except Exception:
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
        t0 = time.time()
        data = request.json
        all_answers = data.get('final_answers', [])
        group_name = data.get('group_name') or data.get('group_type') or data.get('groupType')
        # Optional personalization
        preferences = data.get('preferences', {}) or {}
        job_loc = preferences.get('jobLocation', {}) or {}
        study_loc = preferences.get('studyLocation', {}) or {}
        # Optional previous analysis (sent by Express if user is logged in)
        previous = data.get('previous_analysis') or {}
        prev_ai = previous.get('aiCareers') or []
        prev_pdf = previous.get('pdfCareers') or []
        prev_group = previous.get('groupName')

        print(f"\n=== Analyzing Answers for Group: {group_name} ===")

        # Step 1: Generate detailed analysis with the first AI
        loc_context = f"""
        Personalization context (optional):
        - Job location preference: country={job_loc.get('country')}, state={job_loc.get('state')}, district={job_loc.get('district')}
        - Study location preference: country={study_loc.get('country')}, state={study_loc.get('state')}, district={study_loc.get('district')}
        """
        history_context = ""
        if prev_ai or prev_pdf:
            try:
                history_context = f"""
                Historical context from last session (if any):
                - Previous group: {prev_group}
                - Previously recommended AI careers (title, match): {json.dumps(prev_ai)[:600]}
                - Previously recommended PDF careers (title, match): {json.dumps(prev_pdf)[:600]}
                Guidance: Avoid repeating identical suggestions unless strongly justified by new answers. If repeating,
                provide improved colleges or roadmap steps and explain why repetition is beneficial. Prefer building
                upon prior top matches to deepen specificity (local colleges, certifications, internships).
                """
            except Exception:
                history_context = ""

        analysis_prompt = f"""Analyze these career-related responses for a student in the '{group_name}' category:
        {json.dumps(all_answers, indent=2)}
        {loc_context}
        {history_context}
        
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
        # Build location constraint guidance for colleges/roadmap
        def loc_str(parts):
            return ', '.join([str(v) for v in parts if v])
        job_where = loc_str([job_loc.get('district'), job_loc.get('state'), job_loc.get('country')])
        study_where = loc_str([study_loc.get('district'), study_loc.get('state'), study_loc.get('country')])
        loc_requirements = """
        When listing colleges and tailoring the roadmap:
        - If study location is provided, prefer colleges/programs in: {study_where}.
        - If job location is provided, prefer certifications/internships and market notes relevant to: {job_where}.
        - For India, mention state/central-level exams or boards when relevant. For abroad, align to the specified country frameworks.
        Only use these constraints if values are provided; otherwise use globally relevant suggestions.
        """
        history_bias = ""
        if prev_ai:
            try:
                top_prev = ", ".join([c.get('title') for c in prev_ai if isinstance(c, dict) and c.get('title')][:5])
                history_bias = f"""
                Also consider the user's previous high-match careers: {top_prev}.
                If consistent with the new analysis, either refine these with better localized colleges and clearer roadmaps,
                or propose adjacent careers with strong rationale. Avoid exact duplicates without added value.
                """
            except Exception:
                history_bias = ""

        career_prompt = f"""Based on this analysis for a '{group_name}' student:
        {detailed_analysis}
        {loc_requirements}
        {history_bias}
        
        Recommend 5 best-matching careers. Format as JSON array:
        [
            {{
                "title": "Career Title",
                "match": match_percentage,
                "description": "Why this career matches",
                "scores": {{
                  "logic": 0-100,
                  "creativity": 0-100,
                  "social": 0-100,
                  "organization": 0-100
                }},
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
                        "location": "Location (prefer {study_where} if provided)"
                    }}
                ]
            }}
        ]
        Include 3-4 top colleges/universities for each career.
        Each match_percentage should be between 75-100.
        The "scores" must reflect the user's strengths inferred from the analysis and sum is not required; each is an independent 0-100 rating.
        """

        schema_hint = (
            "Return ONLY a JSON array of 5 objects with keys: 'title' (string), 'match' (number 75-100), 'description' (string), 'scores' (object with keys 'logic','creativity','social','organization' each 0-100),\n"
            "'roadmap' (array of 3 strings: Entry Level, Mid Level, Senior Level), 'colleges' (array of 3-4 objects with 'name', 'program', 'duration', 'location').\n"
            f"Base your recommendations strictly on this analysis for '{group_name}':\n{detailed_analysis}"
        )
        careers = generate_json_array_with_retry(career_ai, career_prompt, schema_hint)

        # Step 3: Get PDF-based career recommendations (new code)
        pdf_careers = get_pdf_career_recommendations(detailed_analysis)
        
        elapsed = round(time.time() - t0, 2)
        print(f"Analyze answers completed in {elapsed}s")
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
        # Use cached PDF text (avoids repeated disk I/O and parsing)
        pdf_text = get_pdf_text()

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

        schema_hint = (
            "Return ONLY a JSON array of 5 objects with keys: 'title' (string from PDF list), 'match' (number 75-100), 'description' (string).\n"
            f"Base your choices strictly on the analysis and the provided PDF careers list."
        )
        return generate_json_array_with_retry(career_ai, pdf_analysis_prompt, schema_hint)

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

@app.route('/skill-gap', methods=['POST'])
def skill_gap():
    try:
        data = request.json or {}
        all_answers = data.get('final_answers') or data.get('answers') or []
        group_name = data.get('group_name') or data.get('group_type') or data.get('groupType') or 'General'
        target_careers = data.get('target_careers') or data.get('careers') or []
        preferences = data.get('preferences', {}) or {}
        job_loc = preferences.get('jobLocation', {}) or {}
        study_loc = preferences.get('studyLocation', {}) or {}

        # Compact answers to reduce token size
        try:
            compact_answers = [
                {
                    'q': (qa.get('question') or '')[:140],
                    'a': (qa.get('answer') or '')[:200]
                }
                for qa in (all_answers if isinstance(all_answers, list) else [])
            ][:25]
        except Exception:
            compact_answers = []

        loc_context = f"""
        Personalization context:
        - Group: {group_name}
        - Job location preference: country={job_loc.get('country')}, state={job_loc.get('state')}, district={job_loc.get('district')}
        - Study location preference: country={study_loc.get('country')}, state={study_loc.get('state')}, district={study_loc.get('district')}
        Only apply location constraints if present.
        """

        careers_hint = (
            f"Target careers to analyze: {json.dumps(target_careers)}" if target_careers else
            "If no target careers are provided, infer 3 likely careers from the answers and analyze those."
        )

        prompt = f"""
        You are an expert career coach. From the following compact answers, extract the user's current skills and compare
        against required skills for the target careers. Then produce a personalized plan to close the gaps.

        Answers (compact JSON):\n{json.dumps(compact_answers, ensure_ascii=False)}
        {loc_context}
        {careers_hint}

        Return ONLY valid JSON in this exact schema:
        {{
          "userSkills": {{
            "core": ["..."],
            "technical": ["..."],
            "soft": ["..."],
            "tools": ["..."],
            "certifications": ["..."]
          }},
          "careers": [
            {{
              "title": "Career Title",
              "match": 75-100,
              "requiredSkills": {{
                "core": ["..."],
                "technical": ["..."],
                "soft": ["..."],
                "tools": ["..."],
                "certifications": ["..."]
              }},
              "gaps": {{
                "missing": ["skills the user lacks"],
                "toStrengthen": ["skills to improve"],
                "notes": "very short rationale"
              }},
              "recommendations": {{
                "courses": [{{"title":"...","provider":"Coursera/edX/YouTube","url":"https://..."}}],
                "projects": [{{"title":"...","description":"1-2 lines","steps":["step 1","step 2"]}}],
                "certifications": ["..."]
              }},
              "next90DaysPlan": {{
                "day0_30": ["..."],
                "day31_60": ["..."],
                "day61_90": ["..."]
              }},
              "metrics": ["e.g., build 2 projects, 10 LeetCode easy, pass XYZ cert"]
            }}
          ]
        }}

        Notes:
        - Tailor courses/providers to the user's locations when possible (e.g., local colleges, state boards, country-specific certs).
        - Prefer beginner-friendly, reputable resources. Include at least 1 free option.
        - Keep text concise; avoid long paragraphs.
        - Return ONLY JSON. No markdown fences or extra text.
        """

        resp = career_ai.generate_content(prompt)
        raw = (resp.text or "").strip()
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = extract_json_from_text(raw)
        if not parsed or not isinstance(parsed, dict):
            raise ValueError("Model did not return a valid JSON object for skill gap analysis.")

        return jsonify(parsed)
    except Exception as e:
        print(f"Skill gap analysis error: {str(e)}")
        return jsonify({"error": str(e)}), 500

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

@app.route('/course-plan', methods=['POST'])
def course_plan():
    try:
        data = request.json or {}
        career_title = data.get('careerTitle') or data.get('career')
        course = data.get('course') or {}
        user_skills = data.get('userSkills') or {}
        gaps = data.get('gaps') or {}

        if not career_title or not course:
            return jsonify({"error": "careerTitle and course are required"}), 400

        # Build a concise prompt for a 90-day plan aligned to the selected course
        course_name = course.get('title') or course.get('name') or 'Selected Course'
        provider = course.get('provider') or course.get('platform')
        link = course.get('link') or course.get('url')

        prompt = f"""
        Create a practical 90-day learning plan tailored to prepare for the career: {career_title}.
        Align the plan specifically with the selected course: {course_name}{' (' + provider + ')' if provider else ''}{' - ' + link if link else ''}.

        Consider the user's current skills and gaps provided as JSON.
        User skills: {json.dumps(user_skills)[:1200]}
        Gaps: {json.dumps(gaps)[:800]}

        Requirements:
        - Structure the output as JSON ONLY with keys day0_30, day31_60, day61_90.
        - Each value should be an array of 4-6 concise, actionable bullet steps (strings).
        - Reference the course content pacing (e.g., modules/chapters) and integrate short projects, practice, and checkpoints.
        - Include at least one measurable metric per period (e.g., quiz score, project milestone, practice problem counts).
        - Keep language concise and beginner-friendly.

        Example JSON shape:
        {{
          "day0_30": ["..."],
          "day31_60": ["..."],
          "day61_90": ["..."]
        }}
        """

        resp = career_ai.generate_content(prompt)
        raw = (resp.text or '').strip()
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = extract_json_from_text(raw)
        if not parsed or not isinstance(parsed, dict):
            raise ValueError("Model did not return a valid JSON object for course plan")

        # Normalize alternative keys
        plan = {
            'day0_30': parsed.get('day0_30') or parsed.get('days0_30') or parsed.get('days0to30') or parsed.get('Days 0-30') or [],
            'day31_60': parsed.get('day31_60') or parsed.get('days31_60') or parsed.get('days31to60') or parsed.get('Days 31-60') or [],
            'day61_90': parsed.get('day61_90') or parsed.get('days61_90') or parsed.get('days61to90') or parsed.get('Days 61-90') or [],
        }

        return jsonify({ 'plan': plan })
    except Exception as e:
        print(f"Course plan error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    try:
        print("Starting Flask server on port 5002...")
        app.run(debug=True, port=5002, host='0.0.0.0')
    except Exception as e:
        print(f"Error starting Flask server: {str(e)}")