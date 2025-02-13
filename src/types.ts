export interface Question {
  id: string;
  text: string;
  options: string[];
}

export interface Category {
  category: string;
  questions: Question[];
}

export interface Answer {
  questionId: string;
  answer: string;
}

export interface QuizResponse {
  answers: Answer[];
}