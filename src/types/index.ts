export type ApiStatus = 'success' | 'error'

export interface ApiResponse<T> {
  status: ApiStatus
  message?: string
  data: T
}

export interface ApiErrorResponse {
  status: 'error'
  message: string
  errors?: Array<{
    type?: string
    msg?: string
    path?: string
    location?: string
  }>
}

export interface User {
  id?: string
  userId?: string
  name?: string
  role?: string
  email?: string
  avatarUrl?: string
}

export interface Subject {
  id: string
  name: string
  created_at?: string
  updated_at?: string
}

export interface Topic {
  id: string
  name: string
  subject_id: string
}

export interface SubTopic {
  id: string
  name: string
  topic_id: string
}

/** API enum values (DB constraint tests_type_check) */
export type TestType = 'chapterwise' | 'pyq' | 'mock'
export type TestDifficulty = 'easy' | 'medium' | 'difficult' | 'hard'
export type TestStatus = 'draft' | 'live' | 'scheduled' | string

export interface Test {
  id: string
  name: string
  type?: TestType | string
  subject?: string | Subject
  subject_id?: string
  topics?: string[] | Topic[]
  sub_topics?: string[] | SubTopic[]
  correct_marks?: number
  wrong_marks?: number
  unattempt_marks?: number
  difficulty?: TestDifficulty | string
  total_time?: number
  total_marks?: number
  total_questions?: number
  status?: TestStatus
  created_at?: string
  questions?: string[] | Question[]
}

export interface Question {
  id?: string
  type?: string
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  correct_option: 'option1' | 'option2' | 'option3' | 'option4'
  explanation?: string
  difficulty?: string
  topic?: string
  sub_topic?: string
  subject?: string
  media_url?: string
  test_id?: string
}

export interface CreateTestPayload {
  name: string
  type: string
  subject: string
  topics: string[]
  sub_topics: string[]
  correct_marks: number
  wrong_marks: number
  unattempt_marks: number
  difficulty: string
  total_time: number
  total_marks: number
  total_questions: number
  status?: 'live' | 'unpublished' | 'scheduled' | 'expired' | 'draft'
}

export type UpdateTestPayload = Partial<CreateTestPayload> & {
  questions?: string[]
  scheduled_at?: string
}

export interface LoginPayload {
  userId: string
  password: string
}
