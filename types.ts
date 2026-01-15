export type QuestionType = 'single_choice' | 'multiple_choice' | 'rating' | 'text' | 'image_select';

export interface Option {
  id: string;
  label: string;
  emoji?: string;
  image?: string;
}

export interface Question {
  id: string;
  text: string;
  subtext?: string;
  type: QuestionType;
  options?: Option[];
  required?: boolean;
  placeholder?: string;
}

export interface SurveyResponse {
  questionId: string;
  answer: string | string[] | number;
}

export interface CompletedSurvey {
  id: string;
  timestamp: number;
  responses: SurveyResponse[];
}

export interface AnalyticsSummary {
  totalRespondents: number;
  averageTicket: number;
  topCategory: string;
  onlinePurchaseInterestAvg: number;
  platformPreference: { name: string; value: number }[];
}