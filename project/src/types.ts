export interface ProcessedPage {
  pageNumber: number;
  originalText: string;
  translatedText: string;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  options?: string[];
}

export interface Question {
  number: number;
  text: string;
  alternatives: {
    letter: string;
    text: string;
  }[];
}

export interface ProcessedQuestions {
  pattern: string;
  questions: Question[];
}