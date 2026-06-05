import type {
  ApiResponse,
  CreateTestPayload,
  UpdateTestPayload,
  LoginPayload,
  Question,
  Subject,
  SubTopic,
  Test,
  Topic,
  User,
} from '../types'
import { apiClient } from './client'

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<ApiResponse<{ token: string; user: User }>>(
      '/auth/login',
      payload,
    ),
}

export const subjectsApi = {
  getAll: () => apiClient.get<ApiResponse<Subject[]>>('/subjects'),
}

export const topicsApi = {
  getBySubject: (subjectId: string) =>
    apiClient.get<ApiResponse<Topic[]>>(`/topics/subject/${subjectId}`),
}

export const subTopicsApi = {
  getByTopic: (topicId: string) =>
    apiClient.get<ApiResponse<SubTopic[]>>(`/sub-topics/topic/${topicId}`),
  getByMultipleTopics: (topicIds: string[]) =>
    apiClient.post<ApiResponse<SubTopic[]>>('/sub-topics/multi-topics', {
      topicIds,
    }),
}

export const testsApi = {
  getAll: () => apiClient.get<ApiResponse<Test[]>>('/tests'),
  getById: (id: string) => apiClient.get<ApiResponse<Test>>(`/tests/${id}`),
  create: (payload: CreateTestPayload) =>
    apiClient.post<ApiResponse<Test>>('/tests', payload),
  update: (id: string, payload: UpdateTestPayload) =>
    apiClient.put<ApiResponse<Test>>(`/tests/${id}`, payload),
  delete: (id: string) => apiClient.delete<ApiResponse<unknown>>(`/tests/${id}`),
  publish: (id: string) =>
    apiClient.put<ApiResponse<Test>>(`/tests/${id}`, { status: 'live' }),
}

export const questionsApi = {
  bulkCreate: (questions: Question[]) =>
    apiClient.post<ApiResponse<Question[]>>('/questions/bulk', { questions }),
  fetchBulk: (questionIds: string[]) =>
    apiClient.post<ApiResponse<Question[]>>('/questions/fetchBulk', {
      question_ids: questionIds,
    }),
}
