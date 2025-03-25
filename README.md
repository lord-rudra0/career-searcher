# Career Glimpse - Career Guidance System

## Overview
Career Glimpse is an intelligent career guidance system that helps students and professionals discover their ideal career paths through personalized assessments and AI-powered recommendations. The system caters to different educational levels, from secondary school students to postgraduates.

## Features
- **Personalized Assessment**: Dynamic questionnaire that adapts based on user responses
- **AI-Powered Analysis**: Uses Google's Gemini AI to analyze responses and generate career recommendations
- **Educational Category Support**: Tailored guidance for:
  - Class 9-10 (Secondary School)
  - Class 11-12 (Higher Secondary)
  - Undergraduate Students
  - Postgraduate Students
- **Interactive Chat Support**: Real-time career guidance chatbot
- **Career Roadmaps**: Detailed career progression paths for recommended careers
- **PDF-Based Recommendations**: Additional career matches from curated PDF resources
- **Web Search Integration**: Real-time career information from online sources

## Tech Stack
### Frontend
- React.js
- Tailwind CSS
- Lucide React (Icons)
- Axios (API calls)

### Backend
- Python Flask
- Google Gemini AI
- BeautifulSoup4 (Web scraping)
- PyPDF2 (PDF processing)

## Prerequisites
- Node.js (v14 or higher)
- Python (v3.8 or higher)
- Google Gemini API key

## Installation

### Frontend Setup
```bash
# Clone the repository
git clone [your-repo-url]
cd career-searcher

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# For Windows
venv\Scripts\activate
# For Unix or MacOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file and add your Gemini API key
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Start Flask server
python app.py
```

## Environment Variables
Create a `.env` file in the backend directory with the following:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Project Structure 