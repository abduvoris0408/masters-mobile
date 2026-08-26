export interface IMandatoryCourseListItem {
  id: number;
  guid: string;
  title: string;
  description: string;
  lessons_count: number;
  is_completed: boolean;
}

export type EMandatoryLessonType = "video" | (string & {});

export interface IMandatoryCourseLesson {
  id: number;
  guid: string;
  title: string;
  description: string;
  type: EMandatoryLessonType;
  file: string | null;
  is_read: boolean;
}

export interface IMandatoryCourseDetail {
  id: number;
  guid: string;
  title: string;
  description: string;
  lessons: IMandatoryCourseLesson[];
}

export interface ICreateLessonProgressResponse {
  id: number;
  guid: string;
  lesson: number;
  course: number;
  lesson_title: string;
  read_at: string;
}

export interface ICreateCourseCompletionResponse {
  id: number;
  guid: string;
  course: number;
  course_title: string;
  completed_at: string;
}
