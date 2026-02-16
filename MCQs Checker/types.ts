
export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface Answer {
  questionNumber: number;
  answer: string;
}

export interface AnswerKey {
  id: string;
  name: string;
  answers: Record<number, string>;
  totalQuestions: number;
  lastUpdated: string;
}

export interface StudentResult {
  id: string;
  studentName: string;
  studentId: string;
  score: number;
  totalQuestions: number;
  grade: Grade;
  percentage: number;
  answers: Record<number, string>;
  isCorrect: Record<number, boolean>;
  checkedAt: string;
  imageUrl?: string;
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  MASTER_KEY = 'master_key',
  CHECK_SHEETS = 'check_sheets',
}
