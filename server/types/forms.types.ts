export type QuestionType = 'short_text' | 'paragraph' | 'multiple_choice' | 'checkbox' | 'dropdown' | 'file_upload';

export interface QuestionDTO {
  id: string;
  form_id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  
  // Конфигурация зависит от типа вопроса
  options?: {
    id: string;
    text: string;
    // Логика переходов (если выбрал это -> иди в секцию 2)
    go_to_section_id?: string; 
  }[];
  
  // Валидация (например, макс. длина текста или расширения файлов)
  validation?: {
    max_length?: number;
    regex?: string;
    allowed_file_types?: string[];
  };
}

export interface SubmissionPayload {
  started_at: string; // ISO Date (для трекинга времени заполнения)
  submitted_at: string;
  answers: {
    question_id: string;
    // Значение может быть строкой, массивом (для чекбоксов) или ID файла
    value: string | string[] | number; 
  }[];
}
